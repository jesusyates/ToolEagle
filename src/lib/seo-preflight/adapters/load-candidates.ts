import fs from "node:fs/promises";
import path from "node:path";
import type { SeoPreflightContentType } from "../types/preflight";
import type { TopicRegistryFile } from "./topic-registry-types";

const CANDIDATES_FILE = "seo-preflight-candidates.json";

function humanizeTopicKey(topicKey: string): string {
  return topicKey.replace(/-/g, " ").replace(/\s+/g, " ").trim();
}

/** Optional JSON: `{ "topics": string[] }` under generated/. */
export async function loadOptionalCandidateFile(repoRoot?: string): Promise<string[]> {
  const root = repoRoot ?? process.cwd();
  const filePath = path.join(root, "generated", CANDIDATES_FILE);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const j = JSON.parse(raw) as { topics?: unknown };
    if (!Array.isArray(j.topics)) return [];
    return j.topics.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((t) => t.trim());
  } catch {
    return [];
  }
}

/** Seeds from topic registry keys (Web-only; no orchestrator). */
export async function loadRegistryTopicSeeds(repoRoot?: string): Promise<string[]> {
  const root = repoRoot ?? process.cwd();
  const filePath = path.join(root, "generated", "topic-registry.json");
  const raw = await fs.readFile(filePath, "utf8");
  const data = JSON.parse(raw) as TopicRegistryFile;
  const out: string[] = [];
  for (const row of data.topics ?? []) {
    const h = humanizeTopicKey(row.topicKey);
    if (h) out.push(h);
  }
  return out;
}

/**
 * Merge file topics, request seeds, then registry keys (dedup order-preserving).
 */
export function mergeCandidateTopics(fileTopics: string[], requestSeeds: string[], registrySeeds: string[]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const list of [requestSeeds, fileTopics, registrySeeds]) {
    for (const t of list) {
      const k = t.replace(/\s+/g, " ").trim();
      if (!k || seen.has(k.toLowerCase())) continue;
      seen.add(k.toLowerCase());
      merged.push(k);
    }
  }
  return merged;
}

export type CandidateTopicRow = { topic: string; contentType: SeoPreflightContentType };

/**
 * Same merge order as `mergeCandidateTopics`, but keeps per-row `contentType` (e.g. from scenario mapper).
 * Later sources do not override an existing topic slug.
 */
export function mergeCandidateTopicRows(
  fileTopics: string[],
  requestRows: Array<{ topic: string; contentType?: SeoPreflightContentType }>,
  registrySeeds: string[],
  defaultContentType: SeoPreflightContentType
): CandidateTopicRow[] {
  const seen = new Set<string>();
  const merged: CandidateTopicRow[] = [];
  const push = (topic: string, contentType?: SeoPreflightContentType) => {
    const k = topic.replace(/\s+/g, " ").trim();
    if (!k) return;
    const key = k.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    merged.push({ topic: k, contentType: contentType ?? defaultContentType });
  };
  for (const row of requestRows) push(row.topic, row.contentType);
  for (const t of fileTopics) push(t, defaultContentType);
  for (const t of registrySeeds) push(t, defaultContentType);
  return merged;
}
