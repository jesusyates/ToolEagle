/**
 * V166 — Persist retrieval utilization summary for seo:status / flywheel.
 */

import fs from "fs";
import path from "path";
import { computeRetrievalAndAiShare } from "@/lib/seo/flywheel-ramp";
import {
  aggregateRetrievalUsage,
  computeWorkflowRetrievalPerformance,
  topFallbackReason,
  type RetrievalTelemetryRow,
  type TopicRetrievalStats
} from "@/lib/seo/retrieval-utilization-metrics";

export type SeoRetrievalUtilizationJson = {
  version: "166";
  updatedAt: string;
  retrieval_share: number;
  ai_share: number;
  retrieval_hits: number;
  retrieval_fallbacks: number;
  top_retrieval_topics: TopicRetrievalStats[];
  weak_retrieval_topics: TopicRetrievalStats[];
  workflow_retrieval_performance: TopicRetrievalStats[];
  fallback_reason_breakdown: Record<string, number>;
  /** From `seo-retrieval-stats.json` cumulative counters (production totals). */
  production_retrieval_share: number;
  production_ai_share: number;
  production_retrieval_count: number;
  production_ai_count: number;
  bias_events_in_window: number;
  notes: string;
};

const DEFAULT_MAX_LINES = 12000;

function readJson<T>(p: string, fb: T): T {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as T;
  } catch {
    return fb;
  }
}

export function readRetrievalTelemetryRows(cwd: string, maxLines = DEFAULT_MAX_LINES): RetrievalTelemetryRow[] {
  const p = path.join(cwd, "generated", "seo-retrieval-events.jsonl");
  let raw = "";
  try {
    raw = fs.readFileSync(p, "utf8");
  } catch {
    return [];
  }
  const lines = raw.split("\n").filter(Boolean);
  const slice = lines.length > maxLines ? lines.slice(-maxLines) : lines;
  const out: RetrievalTelemetryRow[] = [];
  for (const line of slice) {
    try {
      out.push(JSON.parse(line) as RetrievalTelemetryRow);
    } catch {
      // skip bad line
    }
  }
  return out;
}

export function buildSeoRetrievalUtilizationPayload(
  cwd: string,
  rows: RetrievalTelemetryRow[],
  now = new Date()
): SeoRetrievalUtilizationJson {
  const agg = aggregateRetrievalUsage(rows);
  const workflow_retrieval_performance = computeWorkflowRetrievalPerformance(rows);
  const bias_events_in_window = rows.filter((r) => r.event === "retrieval_bias_applied").length;

  const stats = readJson<{
    retrieval_count?: number;
    ai_generation_count?: number;
    retrieval_share?: number;
  }>(path.join(cwd, "generated", "seo-retrieval-stats.json"), {
    retrieval_count: 0,
    ai_generation_count: 0,
    retrieval_share: 0
  });
  const pr = Math.max(0, Number(stats.retrieval_count) || 0);
  const pa = Math.max(0, Number(stats.ai_generation_count) || 0);
  const { retrieval_share: prodRs, ai_share: prodAs } = computeRetrievalAndAiShare(pr, pa);

  const windowDesc =
    rows.length === 0
      ? "no telemetry rows in window"
      : `${rows.length} parsed event rows (capped)`;
  const notes = [
    `Window utilization: retrieval_share = retrieval_hits / (retrieval_hits + retrieval_fallbacks); source: ${windowDesc}.`,
    `Production (seo-retrieval-stats): retrieval_share = retrieval_count / (retrieval_count + ai_generation_count).`,
    agg.retrieval_hits + agg.retrieval_fallbacks === 0
      ? "No retrieval decision events in window yet — run zh:auto to populate seo-retrieval-events.jsonl."
      : `Top fallback reason: ${topFallbackReason(agg.fallback_reason_breakdown) ?? "n/a"}.`
  ].join(" ");

  return {
    version: "166",
    updatedAt: now.toISOString(),
    retrieval_share: agg.retrieval_share,
    ai_share: agg.ai_share,
    retrieval_hits: agg.retrieval_hits,
    retrieval_fallbacks: agg.retrieval_fallbacks,
    top_retrieval_topics: agg.top_retrieval_topics,
    weak_retrieval_topics: agg.weak_retrieval_topics,
    workflow_retrieval_performance,
    fallback_reason_breakdown: agg.fallback_reason_breakdown,
    production_retrieval_share: prodRs,
    production_ai_share: prodAs,
    production_retrieval_count: pr,
    production_ai_count: pa,
    bias_events_in_window,
    notes
  };
}

export function writeSeoRetrievalUtilizationSummary(cwd: string, now = new Date()): SeoRetrievalUtilizationJson {
  const rows = readRetrievalTelemetryRows(cwd);
  const payload = buildSeoRetrievalUtilizationPayload(cwd, rows, now);
  const outPath = path.join(cwd, "generated", "seo-retrieval-utilization.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
  return payload;
}

export type UtilizationFlywheelSlice = {
  retrieval_hits_window: number;
  retrieval_fallbacks_window: number;
  fallback_top_reason: string | null;
  top_retrieval_topic_sample: string | null;
};

export function utilizationSliceFromPayload(p: SeoRetrievalUtilizationJson): UtilizationFlywheelSlice {
  const topTopic = p.top_retrieval_topics[0]?.topic_key ?? null;
  return {
    retrieval_hits_window: p.retrieval_hits,
    retrieval_fallbacks_window: p.retrieval_fallbacks,
    fallback_top_reason: topFallbackReason(p.fallback_reason_breakdown),
    top_retrieval_topic_sample: topTopic
  };
}
