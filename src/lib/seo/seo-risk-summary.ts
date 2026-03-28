/**
 * V156 — Load workspace publishing context, run risk analysis, write generated artifacts.
 */

import fs from "fs";
import path from "path";
import {
  analyzePublishingRisk,
  slugPrimaryPrefix,
  type PublishingRiskContext,
  type SearchRiskAnalysis
} from "./seo-risk-control";

const VERSION = "v156.0";

export type SeoRiskSummaryArtifact = {
  version: string;
  updatedAt: string;
  risk_score: number;
  risk_level: string;
  signal_breakdown: SearchRiskAnalysis["signals"];
  affected_topics: string[];
  affected_page_types: string[];
  recommended_action: string;
  batch_multiplier: number;
  retrieval_ease_multiplier: number;
  notes: string[];
};

export type SeoRiskContextArtifact = {
  version: string;
  updatedAt: string;
  batch_multiplier: number;
  retrieval_ease_multiplier: number;
  /** Topic prefixes (platform-goal) to deprioritize in generation scoring */
  deprioritized_topic_prefixes: string[];
  /** Caps V63 expansion pool in auto-generate-zh (default 500 when file missing). */
  v63_expansion_limit: number;
  recommended_action: string;
};

function readJson<T>(p: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function parseHistoryDailyTotals(cwd: string, maxLines = 80): number[] {
  const p = path.join(cwd, "generated", "seo-production-history.jsonl");
  if (!fs.existsSync(p)) return [];
  const raw = fs.readFileSync(p, "utf8").trim();
  if (!raw) return [];
  const lines = raw.split(/\n+/).filter(Boolean).slice(-maxLines);
  const byDate = new Map<string, number>();
  for (const line of lines) {
    try {
      const row = JSON.parse(line) as {
        date?: string;
        zh_generated_count?: number;
        en_generated_count?: number;
      };
      if (!row.date) continue;
      const z = Number(row.zh_generated_count ?? 0);
      const e = Number(row.en_generated_count ?? 0);
      byDate.set(row.date, (byDate.get(row.date) || 0) + z + e);
    } catch {
      // skip
    }
  }
  const dates = [...byDate.keys()].sort().reverse();
  return dates.map((d) => byDate.get(d) || 0);
}

function loadZhKeywordContext(cwd: string): {
  topicPrimaryCounts: Record<string, number>;
  slugs: string[];
  titleSamples: string[];
} {
  const p = path.join(cwd, "data", "zh-keywords.json");
  const cache = readJson<Record<string, { h1?: string; title?: string; lastModified?: number; createdAt?: number }>>(
    p,
    {}
  );
  const topicPrimaryCounts: Record<string, number> = {};
  const slugs: string[] = [];
  const titleSamples: string[] = [];
  for (const slug of Object.keys(cache)) {
    slugs.push(slug);
    const k = slugPrimaryPrefix(slug);
    topicPrimaryCounts[k] = (topicPrimaryCounts[k] || 0) + 1;
    const row = cache[slug];
    const t = row?.h1 || row?.title || "";
    if (t) titleSamples.push(t);
  }
  slugs.sort((a, b) => {
    const ta = cache[a]?.lastModified ?? cache[a]?.createdAt ?? 0;
    const tb = cache[b]?.lastModified ?? cache[b]?.createdAt ?? 0;
    return ta - tb;
  });
  return { topicPrimaryCounts, slugs, titleSamples };
}

function countBlogMdx(cwd: string): number {
  const dir = path.join(cwd, "content", "blog");
  try {
    return fs.readdirSync(dir).filter((f) => f.endsWith(".mdx")).length;
  } catch {
    return 0;
  }
}

export function buildPublishingRiskContextFromWorkspace(cwd: string): PublishingRiskContext {
  const dailyNewCounts = parseHistoryDailyTotals(cwd);
  const { topicPrimaryCounts, slugs, titleSamples } = loadZhKeywordContext(cwd);
  const zhN = Object.keys(readJson<Record<string, unknown>>(path.join(cwd, "data", "zh-keywords.json"), {})).length;
  const blogN = countBlogMdx(cwd);
  const pageTypeCounts: Record<string, number> = {
    zh_keyword: zhN,
    en_blog_mdx: blogN
  };
  return {
    dailyNewCounts,
    topicPrimaryCounts,
    pageTypeCounts,
    slugs,
    titleSamples
  };
}

export function buildRiskSummaryArtifact(analysis: SearchRiskAnalysis): SeoRiskSummaryArtifact {
  return {
    version: VERSION,
    updatedAt: new Date().toISOString(),
    risk_score: analysis.risk_score,
    risk_level: analysis.risk_level,
    signal_breakdown: { ...analysis.signals },
    affected_topics: [...analysis.affected_topics],
    affected_page_types: [...analysis.affected_page_types],
    recommended_action: analysis.recommended_action,
    batch_multiplier: analysis.batch_multiplier,
    retrieval_ease_multiplier: analysis.retrieval_ease_multiplier,
    notes: [...analysis.notes]
  };
}

export function buildRiskContextArtifact(
  analysis: SearchRiskAnalysis,
  deprioritized_topic_prefixes: string[]
): SeoRiskContextArtifact {
  const v63_expansion_limit = Math.max(80, Math.round(500 * analysis.batch_multiplier));
  return {
    version: VERSION,
    updatedAt: new Date().toISOString(),
    batch_multiplier: analysis.batch_multiplier,
    retrieval_ease_multiplier: analysis.retrieval_ease_multiplier,
    deprioritized_topic_prefixes,
    v63_expansion_limit,
    recommended_action: analysis.recommended_action
  };
}

export function writeSearchRiskArtifacts(
  cwd: string,
  analysis: SearchRiskAnalysis,
  opts?: { useSandbox?: boolean }
): void {
  const topHeavy = analysis.affected_topics.slice(0, 5);
  const ctx = buildRiskContextArtifact(analysis, topHeavy);

  const base = opts?.useSandbox ? path.join(cwd, "generated", "sandbox") : path.join(cwd, "generated");
  const sumPath = path.join(base, "seo-risk-summary.json");
  const ctxPath = path.join(base, "seo-risk-context.json");
  fs.mkdirSync(path.dirname(sumPath), { recursive: true });
  fs.writeFileSync(sumPath, JSON.stringify(buildRiskSummaryArtifact(analysis), null, 2), "utf8");
  fs.writeFileSync(ctxPath, JSON.stringify(ctx, null, 2), "utf8");
}

export function computeAndWriteSearchRisk(cwd: string, opts?: { useSandbox?: boolean }): SearchRiskAnalysis {
  const context = buildPublishingRiskContextFromWorkspace(cwd);
  const analysis = analyzePublishingRisk(context);
  writeSearchRiskArtifacts(cwd, analysis, opts);
  return analysis;
}
