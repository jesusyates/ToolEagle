import fs from "node:fs/promises";
import path from "node:path";
import type { SeoPreflightContentType } from "../types/preflight";
import { SEO_PREFLIGHT_CONTENT_TYPES } from "../types/preflight";

/** Strings from generated/seo-scenario-topics.json for preflight candidateSeeds. */
export async function loadScenarioTopicStrings(repoRoot?: string): Promise<string[]> {
  const rows = await loadScenarioTopicRows(repoRoot);
  return rows.map((r) => r.topic);
}

function normalizeScenarioContentType(raw: unknown): SeoPreflightContentType | undefined {
  if (typeof raw !== "string") return undefined;
  const t = raw.trim() as SeoPreflightContentType;
  return SEO_PREFLIGHT_CONTENT_TYPES.includes(t) ? t : undefined;
}

/** Full rows from `generated/seo-scenario-topics.json` (topic + optional contentType). */
export async function loadScenarioTopicRows(
  repoRoot?: string
): Promise<Array<{ topic: string; contentType?: SeoPreflightContentType }>> {
  const root = repoRoot ?? process.cwd();
  const p = path.join(root, "generated", "seo-scenario-topics.json");
  try {
    const raw = await fs.readFile(p, "utf8");
    const j = JSON.parse(raw) as { topics?: unknown };
    if (!Array.isArray(j.topics)) return [];
    const out: Array<{ topic: string; contentType?: SeoPreflightContentType }> = [];
    for (const row of j.topics) {
      if (!row || typeof row !== "object") continue;
      const o = row as { topic?: unknown; contentType?: unknown };
      if (typeof o.topic !== "string") continue;
      const topic = o.topic.trim();
      if (!topic) continue;
      const contentType = normalizeScenarioContentType(o.contentType);
      out.push(contentType ? { topic, contentType } : { topic });
    }
    return out;
  } catch {
    return [];
  }
}
