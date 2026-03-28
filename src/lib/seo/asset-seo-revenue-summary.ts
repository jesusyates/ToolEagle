/**
 * V158 — Build generated/asset-seo-revenue-summary.json for queue / CTA / conversion path.
 */

import fs from "fs";
import path from "path";
import type { MonetizationEventRow } from "./asset-seo-monetization-aggregation";
import {
  analyzePublishingRevenueIntelligence,
  enrichSegment,
  type RevenueIntelligenceOutput,
  type RevenueSegmentMetrics
} from "./asset-seo-revenue-intelligence";

export const ASSET_SEO_REVENUE_SUMMARY_ARTIFACT = "generated/asset-seo-revenue-summary.json";

const VERSION = "v158.0";

export type AssetSeoRevenueSummaryArtifact = {
  version: string;
  updatedAt: string;
  top_topics_by_revenue: RevenueSegmentMetrics[];
  top_topics_by_conversion_rate: RevenueSegmentMetrics[];
  highest_rps_topics: RevenueSegmentMetrics[];
  underperforming_topics: RevenueSegmentMetrics[];
  /** 0..1 lookup helpers for queue (topic string → score) */
  topic_revenue_score: Record<string, number>;
  workflow_revenue_score: Record<string, number>;
  notes: string[];
  raw: {
    top_revenue_topics: RevenueSegmentMetrics[];
    top_conversion_pages: RevenueSegmentMetrics[];
    high_intent_segments: RevenueSegmentMetrics[];
    low_value_segments: RevenueSegmentMetrics[];
  };
};

type IntelFile = {
  top_monetizing_topics?: Array<{
    topic: string;
    shown: number;
    clicked: number;
    converted: number;
    revenue: number;
    ctr: number;
    conversion_rate: number;
  }>;
  top_monetizing_workflows?: Array<{
    workflow_id: string;
    shown: number;
    clicked: number;
    converted: number;
    revenue: number;
    ctr: number;
    conversion_rate: number;
  }>;
};

function readJson<T>(p: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function loadOptionalEventRows(cwd: string): MonetizationEventRow[] {
  const p = path.join(cwd, "generated", "asset-seo-monetization-events.json");
  const raw = readJson<unknown>(p, null);
  if (Array.isArray(raw)) return raw as MonetizationEventRow[];
  return [];
}

function intelligenceToRevenueOutput(intel: IntelFile): RevenueIntelligenceOutput {
  const topicSegs: RevenueSegmentMetrics[] = (intel.top_monetizing_topics || []).map((t) =>
    enrichSegment(t.topic, "topic", t.shown, t.clicked, t.converted, t.revenue, null)
  );
  const wfSegs: RevenueSegmentMetrics[] = (intel.top_monetizing_workflows || []).map((w) =>
    enrichSegment(
      w.workflow_id,
      "workflow",
      w.shown,
      w.clicked,
      w.converted,
      w.revenue,
      null
    )
  );
  const segments = [...topicSegs, ...wfSegs];
  const top_revenue_topics = [...topicSegs].sort((a, b) => b.revenue - a.revenue).slice(0, 20);
  const top_conversion_pages = [...topicSegs]
    .filter((s) => s.shown >= 3)
    .sort((a, b) => b.conversion_rate - a.conversion_rate || b.revenue_per_visit - a.revenue_per_visit)
    .slice(0, 20);
  const high_intent_segments = segments.filter(
    (s) => s.shown >= 5 && (s.conversion_rate >= 0.06 || s.monetized_session_rate >= 0.12)
  );
  const low_value_segments = topicSegs
    .filter((s) => s.shown >= 8 && s.revenue_per_visit <= 0.01 && s.conversion_rate < 0.03)
    .sort((a, b) => a.revenue_per_visit - b.revenue_per_visit)
    .slice(0, 25);

  return {
    segments,
    top_revenue_topics,
    top_conversion_pages,
    high_intent_segments,
    low_value_segments
  };
}

function buildScoreMaps(topics: RevenueSegmentMetrics[], workflows: RevenueSegmentMetrics[]) {
  const topic_revenue_score: Record<string, number> = {};
  const workflow_revenue_score: Record<string, number> = {};
  const maxR = Math.max(1, ...topics.map((t) => t.revenue), ...workflows.map((w) => w.revenue));
  for (const t of topics) {
    const key = String(t.segment_key).toLowerCase();
    topic_revenue_score[key] = Math.min(1, t.revenue / maxR * 0.85 + t.conversion_rate * 3);
  }
  for (const w of workflows) {
    const key = String(w.segment_key).toLowerCase();
    workflow_revenue_score[key] = Math.min(1, w.revenue / maxR * 0.85 + w.conversion_rate * 3);
  }
  return { topic_revenue_score, workflow_revenue_score };
}

export function buildAssetSeoRevenueSummary(cwd: string = process.cwd()): AssetSeoRevenueSummaryArtifact {
  const rows = loadOptionalEventRows(cwd);
  const intelPath = path.join(cwd, "generated", "asset-seo-monetization-intelligence.json");
  const intel = readJson<IntelFile>(intelPath, {});

  let out: RevenueIntelligenceOutput;
  const notes: string[] = [];

  if (rows.length > 0) {
    out = analyzePublishingRevenueIntelligence(rows);
    notes.push("source:asset-seo-monetization-events.json");
  } else if ((intel.top_monetizing_topics?.length ?? 0) > 0 || (intel.top_monetizing_workflows?.length ?? 0) > 0) {
    out = intelligenceToRevenueOutput(intel);
    notes.push("source:asset-seo-monetization-intelligence.json(fallback_no_raw_events)");
  } else {
    out = {
      segments: [],
      top_revenue_topics: [],
      top_conversion_pages: [],
      high_intent_segments: [],
      low_value_segments: []
    };
    notes.push("empty:no_monetization_events_or_intelligence");
  }

  const topicPool = out.top_revenue_topics;
  const wfPool = out.segments.filter((s) => s.segment_kind === "workflow");

  const top_topics_by_revenue = [...topicPool].sort((a, b) => b.revenue - a.revenue).slice(0, 15);
  const top_topics_by_conversion_rate = [...topicPool]
    .filter((t) => t.shown >= 3)
    .sort((a, b) => b.conversion_rate - a.conversion_rate)
    .slice(0, 15);
  const highest_rps_topics = [...topicPool]
    .filter((t) => t.shown >= 3)
    .sort((a, b) => b.revenue_per_visit - a.revenue_per_visit)
    .slice(0, 15);
  const underperforming_topics = out.low_value_segments.filter((s) => s.segment_kind === "topic").slice(0, 15);

  const { topic_revenue_score, workflow_revenue_score } = buildScoreMaps(top_topics_by_revenue, wfPool.slice(0, 20));

  notes.push("V158: bounded queue bonuses; respects risk deprioritize in publish-queue; single-topic cap in scorer");

  return {
    version: VERSION,
    updatedAt: new Date().toISOString(),
    top_topics_by_revenue,
    top_topics_by_conversion_rate,
    highest_rps_topics,
    underperforming_topics,
    topic_revenue_score,
    workflow_revenue_score,
    notes,
    raw: {
      top_revenue_topics: out.top_revenue_topics,
      top_conversion_pages: out.top_conversion_pages,
      high_intent_segments: out.high_intent_segments,
      low_value_segments: out.low_value_segments
    }
  };
}

export function writeAssetSeoRevenueSummary(cwd: string = process.cwd()): string {
  const payload = buildAssetSeoRevenueSummary(cwd);
  const out = path.join(cwd, ASSET_SEO_REVENUE_SUMMARY_ARTIFACT.split("/").join(path.sep));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(payload, null, 2), "utf8");
  return out;
}
