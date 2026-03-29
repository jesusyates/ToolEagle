/**
 * V166.1 — Retrieval activation readiness artifact for seo:status (`generated/seo-retrieval-activation.json`).
 */

import fs from "fs";
import path from "path";
import { getRetrievalDatasetReadyMin } from "@/lib/seo/retrieval-dataset-build";

export const RETRIEVAL_ACTIVATION_ARTIFACT_VERSION = "166.1";

export type SeoRetrievalActivationJson = {
  version: string;
  updatedAt: string;
  dataset_ready: boolean;
  workflow_bucket_coverage: Record<string, number>;
  topic_matchability_summary: string;
  retrieval_activation_ready: boolean;
  top_blockers: string[];
  notes: string[];
  /** Optional sampling against data/zh-keywords.json */
  sample_keywords_checked?: number;
  sample_avg_top_score?: number;
  sample_sufficient_count?: number;
};

type WfJson = {
  item_count?: number;
  items?: unknown[];
  buckets?: {
    by_workflow?: Record<string, string[]>;
    by_locale?: Record<string, string[]>;
    by_page_type?: Record<string, string[]>;
  };
};

function readJson<T>(p: string, fb: T): T {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as T;
  } catch {
    return fb;
  }
}

function writeJson(p: string, data: unknown) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
}

/** eslint-disable-next-line @typescript-eslint/no-explicit-any */
function requireV153(cwd: string): any {
  const p = path.join(cwd, "scripts", "lib", "seo-retrieval-v153.js");
  if (!fs.existsSync(p)) return null;
  try {
    // CommonJS script — require from Node when running seo:status (tsx) or tests.
    return require(p);
  } catch {
    return null;
  }
}

function sampleMatchability(
  cwd: string,
  maxSamples: number
): { checked: number; avgTop: number; sufficient: number } {
  const zhPath = path.join(cwd, "data", "zh-keywords.json");
  const v153 = requireV153(cwd);
  if (!v153 || !fs.existsSync(zhPath)) return { checked: 0, avgTop: 0, sufficient: 0 };
  const raw = readJson<Record<string, Record<string, unknown>>>(zhPath, {});
  const slugs = Object.keys(raw)
    .filter((k) => /^(tiktok|youtube|instagram)-/.test(k))
    .slice(0, maxSamples);
  let sum = 0;
  let suff = 0;
  let n = 0;
  for (const slug of slugs) {
    const rec = raw[slug];
    const h1 = String(rec?.h1 || rec?.title || "").trim();
    if (h1.length < 4) continue;
    const platform = slug.split("-")[0] || "";
    const ev = v153.evaluateRetrievalForKeyword({ keyword: h1, platform, goal: "" });
    sum += Number(ev.topScore) || 0;
    if (ev.sufficient) suff++;
    n++;
  }
  return { checked: n, avgTop: n > 0 ? Math.round((sum / n) * 1000) / 1000 : 0, sufficient: suff };
}

/**
 * Build activation summary from workflow dataset + optional zh-keywords sampling.
 */
export function buildRetrievalActivationArtifact(cwd: string, now: Date): SeoRetrievalActivationJson {
  const wfPath = path.join(cwd, "generated", "workflow-assets-retrieval.json");
  const wf = readJson<WfJson | null>(wfPath, null);
  const threshold = getRetrievalDatasetReadyMin();
  const itemCount =
    wf && typeof wf.item_count === "number"
      ? wf.item_count
      : Array.isArray(wf?.items)
        ? wf.items.length
        : 0;
  const dataset_ready = itemCount >= threshold;

  const byWf = wf?.buckets?.by_workflow && typeof wf.buckets.by_workflow === "object" ? wf.buckets.by_workflow : {};
  const platforms = ["tiktok", "youtube", "instagram"] as const;
  const workflow_bucket_coverage: Record<string, number> = {};
  for (const p of platforms) {
    const ids = byWf[p];
    workflow_bucket_coverage[p] = Array.isArray(ids) ? ids.length : 0;
  }

  const emptyBuckets = platforms.filter((p) => (workflow_bucket_coverage[p] ?? 0) < 1);
  const sample = sampleMatchability(cwd, 24);

  const top_blockers: string[] = [];
  if (!dataset_ready) {
    top_blockers.push(`dataset_below_threshold_need_${threshold}_rows_have_${itemCount}`);
  }
  if (emptyBuckets.length) {
    top_blockers.push(`workflow_buckets_empty:${emptyBuckets.join(",")}`);
  }
  if (sample.checked > 0 && sample.avgTop < 0.12) {
    top_blockers.push("sample_avg_top_score_low_vs_dataset");
  }
  if (sample.checked > 0 && sample.sufficient === 0 && dataset_ready) {
    top_blockers.push("no_sample_keywords_passed_retrieval_threshold_yet");
  }

  const retrieval_activation_ready =
    dataset_ready &&
    emptyBuckets.length === 0 &&
    (sample.checked === 0 || sample.avgTop >= 0.1 || sample.sufficient >= 1);

  const topic_matchability_summary =
    sample.checked > 0
      ? `Sampled ${sample.checked} zh-keywords h1/title rows: avg top_score=${sample.avgTop}, sufficient=${sample.sufficient} (V166.1 matching + activation pass).`
      : "No zh-keywords sample run (missing data/zh-keywords.json or v153); workflow-only stats below.";

  const notes = [
    "V166.1 adds CJK/substring/goal overlap and bounded activation threshold pass when dataset + workflow bucket + similarity signals hold.",
    `Workflow row count: ${itemCount}; locale buckets: ${Object.keys(wf?.buckets?.by_locale || {}).length || 0}; page_type buckets: ${Object.keys(wf?.buckets?.by_page_type || {}).length || 0}.`
  ];

  return {
    version: RETRIEVAL_ACTIVATION_ARTIFACT_VERSION,
    updatedAt: now.toISOString(),
    dataset_ready,
    workflow_bucket_coverage,
    topic_matchability_summary,
    retrieval_activation_ready,
    top_blockers: top_blockers.length ? top_blockers : ["none"],
    notes,
    ...(sample.checked > 0
      ? {
          sample_keywords_checked: sample.checked,
          sample_avg_top_score: sample.avgTop,
          sample_sufficient_count: sample.sufficient
        }
      : {})
  };
}

export function writeRetrievalActivationArtifact(cwd: string, now = new Date()): SeoRetrievalActivationJson {
  const data = buildRetrievalActivationArtifact(cwd, now);
  writeJson(path.join(cwd, "generated", "seo-retrieval-activation.json"), data);
  return data;
}
