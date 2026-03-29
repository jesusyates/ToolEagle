/**
 * V165 — Build `generated/workflow-assets-retrieval.json` from HQ assets (dedup, buckets).
 */

import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import type {
  WorkflowRetrievalBuckets,
  WorkflowRetrievalDocument,
  WorkflowRetrievalRow
} from "@/lib/seo/retrieval-dataset-schema";

export const RETRIEVAL_DATASET_READY_MIN_DEFAULT = 3;

export function getRetrievalDatasetReadyMin(): number {
  const n = parseInt(process.env.RETRIEVAL_DATASET_MIN_ROWS || "", 10);
  if (Number.isFinite(n) && n >= 1) return n;
  return RETRIEVAL_DATASET_READY_MIN_DEFAULT;
}

function normalizeHqList(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  if (raw && typeof raw === "object" && Array.isArray((raw as { items?: unknown[] }).items)) {
    return (raw as { items: Record<string, unknown>[] }).items;
  }
  if (raw && typeof raw === "object" && Array.isArray((raw as { assets?: unknown[] }).assets)) {
    return (raw as { assets: Record<string, unknown>[] }).assets;
  }
  return [];
}

export function normalizeTopicKey(topic: string): string {
  return String(topic || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function inferLocale(pageType: string, workflow: string): string {
  const pt = String(pageType || "").toLowerCase();
  const wf = String(workflow || "").toLowerCase();
  if (pt.includes("zh") || pt === "zh_keyword" || pt === "zh_search") return "zh";
  if (wf.includes("en_") || pt.includes("en_") || pt.includes("english")) return "en";
  return "zh";
}

function retrievalDedupKey(row: {
  dedup_hash?: unknown;
  normalized_topic: string;
  content_summary: string;
}): string {
  if (row.dedup_hash && String(row.dedup_hash).length >= 8) return String(row.dedup_hash);
  const slice = row.content_summary.slice(0, 400);
  return createHash("sha256").update(`${row.normalized_topic}|${slice}`, "utf8").digest("hex");
}

function hqRecordToCandidate(raw: Record<string, unknown>): WorkflowRetrievalRow | null {
  const topic = String(raw.topic ?? raw.title ?? "").trim();
  if (!topic) return null;
  const normalized_topic = normalizeTopicKey(topic);
  const workflow = String(raw.workflow ?? raw.workflow_id ?? "").trim();
  const page_type = String(raw.page_type ?? "").trim() || "unknown";
  const content_summary = String(raw.content_summary ?? raw.snippet ?? raw.summary ?? "").slice(0, 4000);
  const quality_score = Math.min(1, Math.max(0, Number(raw.quality_score) || 0));
  const created_at =
    typeof raw.created_at === "string" && raw.created_at
      ? raw.created_at
      : new Date().toISOString();
  const dedupKey = retrievalDedupKey({
    dedup_hash: raw.dedup_hash,
    normalized_topic,
    content_summary
  });
  const id = String(raw.id ?? "").trim() || `hq-${dedupKey.slice(0, 16)}`;
  const locale = inferLocale(page_type, workflow);
  return {
    id,
    topic,
    normalized_topic,
    workflow,
    page_type,
    locale,
    content_summary,
    quality_score,
    created_at
  };
}

/**
 * Pure: HQ JSON → deduplicated document (no I/O).
 */
export function buildRetrievalDatasetFromHqJson(hqRaw: unknown, builtAt = new Date()): WorkflowRetrievalDocument {
  const list = normalizeHqList(hqRaw);
  const source_asset_count = list.length;
  const bestByKey = new Map<string, WorkflowRetrievalRow>();

  for (const raw of list) {
    const row = hqRecordToCandidate(raw);
    if (!row) continue;
    const key = retrievalDedupKey({
      dedup_hash: raw.dedup_hash,
      normalized_topic: row.normalized_topic,
      content_summary: row.content_summary
    });
    const prev = bestByKey.get(key);
    if (!prev || row.quality_score > prev.quality_score) {
      bestByKey.set(key, row);
    }
  }

  const items = [...bestByKey.values()].sort((a, b) => b.quality_score - a.quality_score || b.created_at.localeCompare(a.created_at));

  const buckets: WorkflowRetrievalBuckets = {
    by_workflow: {},
    by_page_type: {},
    by_locale: {}
  };
  for (const r of items) {
    const wf = r.workflow || "_none";
    const pt = r.page_type || "_none";
    const loc = r.locale || "_none";
    (buckets.by_workflow[wf] ??= []).push(r.id);
    (buckets.by_page_type[pt] ??= []).push(r.id);
    (buckets.by_locale[loc] ??= []).push(r.id);
  }

  return {
    version: "165",
    builtAt: builtAt.toISOString(),
    source: "agent_high_quality_assets.json",
    source_asset_count,
    item_count: items.length,
    items,
    buckets
  };
}

export type BuildRetrievalDatasetResult = {
  document: WorkflowRetrievalDocument;
  itemCount: number;
  builtAt: string;
};

export function buildAndWriteRetrievalDataset(cwd = process.cwd(), now = new Date()): BuildRetrievalDatasetResult {
  const hqPath = path.join(cwd, "generated", "agent_high_quality_assets.json");
  const wfPath = path.join(cwd, "generated", "workflow-assets-retrieval.json");
  let hqRaw: unknown = [];
  try {
    hqRaw = JSON.parse(fs.readFileSync(hqPath, "utf8"));
  } catch {
    hqRaw = [];
  }
  const document = buildRetrievalDatasetFromHqJson(hqRaw, now);
  fs.mkdirSync(path.dirname(wfPath), { recursive: true });
  fs.writeFileSync(wfPath, JSON.stringify(document, null, 2), "utf8");
  return {
    document,
    itemCount: document.item_count,
    builtAt: document.builtAt
  };
}
