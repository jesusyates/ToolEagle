/**
 * V160 / V160.1 — Durable dominance artifact + autopilot summary slice (generated/*.json).
 */

import fs from "fs";
import path from "path";
import { resolveSeoGeneratedDir } from "./seo-sandbox";
import {
  aggregateAiCitationMetrics,
  CITATION_READY_QUALITY_THRESHOLD,
  DEFAULT_CITATION_MIN_SAMPLES,
  metricRowFromPublishQueueItem,
  type AiCitationAggregateResult,
  type AiCitationMetricRow
} from "./asset-seo-ai-citation-metrics";
/** Queue row shape after V159+V160 (avoids circular import with publish-queue). */
export type AiCitationQueueItemLike = {
  topic_key: string;
  lane: "zh" | "en";
  id: string;
  ai_citation_likely: number;
  ai_answer_quality_score: number;
  structured_content_ratio: number;
  ai_citation_dominance_bonus?: number;
  weak_ai_citation_penalty?: number;
};

export const AI_CITATION_DOMINANCE_VERSION = "v160.1.0";

export type CitationTopicArtifactEntry = {
  topic_key: string;
  composite: number;
  adjusted_composite: number;
  confidence_weight: number;
  mean_quality: number;
  n: number;
};

export type AssetSeoAiCitationDominanceArtifact = {
  version: string;
  updatedAt: string;
  overall_ai_citation_score: number;
  min_sample_thresholds: AiCitationAggregateResult["min_sample_thresholds"];
  confidence_weight_notes: string[];
  established_topic_count: number;
  emerging_topic_count: number;
  top_ai_citable_topics: CitationTopicArtifactEntry[];
  emerging_ai_citable_topics: CitationTopicArtifactEntry[];
  top_ai_citable_page_types: Array<{
    page_type: string;
    composite: number;
    adjusted_composite: number;
    confidence_weight: number;
    mean_quality: number;
    n: number;
  }>;
  top_ai_citable_workflows: Array<{
    workflow_id: string;
    composite: number;
    adjusted_composite: number;
    confidence_weight: number;
    mean_quality: number;
    n: number;
  }>;
  weak_topics: Array<{ topic_key: string; composite: number; mean_quality: number; n: number }>;
  citation_ready_rate: number;
  avg_structured_content_ratio: number;
  notes: string[];
  topic_performance: AiCitationAggregateResult["topic_performance"];
  page_type_performance: AiCitationAggregateResult["page_type_performance"];
  workflow_performance: AiCitationAggregateResult["workflow_performance"];
};

export type AssetSeoAutopilotSummaryV160 = {
  version: string;
  updatedAt: string;
  citation_ready_rate: number;
  top_ai_citable_topics: string[];
  emerging_ai_citable_topics: string[];
  overall_ai_citation_score: number;
  ai_citation_dominance_bonus_count: number;
  weak_ai_citation_penalty_count: number;
  queue_item_count: number;
  established_topic_count: number;
  emerging_topic_count: number;
  notes: string[];
  /** V161 — merged from asset-seo-traffic-allocation.json when publish queue artifact is built */
  top_allocated_topics?: string[];
  top_allocated_workflows?: string[];
  top_allocated_page_types?: string[];
  suppressed_segment_count?: number;
  exploration_quota_count?: number;
  /** V162 — merged from asset-seo-segment-strategy.json */
  top_segments_by_value?: string[];
  segment_distribution?: Record<string, number>;
  segment_bias_counts?: { prioritized: number; deprioritized: number; neutral: number };
  /** V163 — merged from asset-seo-intent-escalation.json */
  intent_escalation_paths_sample?: Array<{ from: string; to: string; count: number }>;
  intent_state_distribution?: Record<string, number>;
};

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function topicEntry(t: AiCitationAggregateResult["topic_performance"][string]): CitationTopicArtifactEntry {
  return {
    topic_key: t.topic_key,
    composite: t.composite,
    adjusted_composite: t.adjusted_composite,
    confidence_weight: t.confidence_weight,
    mean_quality: t.mean_ai_answer_quality_score,
    n: t.n
  };
}

export function buildAssetSeoAiCitationDominanceArtifactFromQueueItems(
  items: AiCitationQueueItemLike[]
): AssetSeoAiCitationDominanceArtifact {
  const rows: AiCitationMetricRow[] = items.map(metricRowFromPublishQueueItem);
  const agg = aggregateAiCitationMetrics(rows, DEFAULT_CITATION_MIN_SAMPLES);
  const th = agg.min_sample_thresholds;

  const citation_ready_rate =
    items.length === 0
      ? 0
      : Number(
          (
            items.filter((i) => i.ai_answer_quality_score >= CITATION_READY_QUALITY_THRESHOLD).length / items.length
          ).toFixed(4)
        );

  const avg_structured_content_ratio =
    items.length === 0
      ? 0
      : Number((items.reduce((s, i) => s + i.structured_content_ratio, 0) / items.length).toFixed(4));

  const topicVals = Object.values(agg.topic_performance);
  const established_topic_count = topicVals.filter((t) => t.n >= th.min_samples_topic).length;
  const emerging_topic_count = topicVals.filter((t) => t.n >= 1 && t.n < th.min_samples_topic).length;

  const establishedSorted = topicVals
    .filter((t) => t.n >= th.min_samples_topic)
    .sort((a, b) => b.adjusted_composite - a.adjusted_composite);
  const top_ai_citable_topics = establishedSorted.slice(0, 15).map(topicEntry);

  const emergingSorted = topicVals
    .filter((t) => t.n >= 1 && t.n < th.min_samples_topic)
    .sort((a, b) => b.composite - a.composite);
  const emerging_ai_citable_topics = emergingSorted.slice(0, 15).map(topicEntry);

  const weak_topics = topicVals
    .filter((t) => t.n >= th.min_samples_topic && t.mean_ai_answer_quality_score < 48)
    .sort((a, b) => a.adjusted_composite - b.adjusted_composite)
    .slice(0, 15)
    .map((t) => ({
      topic_key: t.topic_key,
      composite: t.composite,
      mean_quality: t.mean_ai_answer_quality_score,
      n: t.n
    }));

  const pageRanked = Object.values(agg.page_type_performance).sort((a, b) => b.adjusted_composite - a.adjusted_composite);
  const top_ai_citable_page_types = pageRanked.slice(0, 5).map((p) => ({
    page_type: p.page_type,
    composite: p.composite,
    adjusted_composite: p.adjusted_composite,
    confidence_weight: p.confidence_weight,
    mean_quality: p.mean_ai_answer_quality_score,
    n: p.n
  }));

  const wfRanked = Object.values(agg.workflow_performance).sort((a, b) => b.adjusted_composite - a.adjusted_composite);
  const top_ai_citable_workflows = wfRanked.slice(0, 5).map((w) => ({
    workflow_id: w.workflow_id,
    composite: w.composite,
    adjusted_composite: w.adjusted_composite,
    confidence_weight: w.confidence_weight,
    mean_quality: w.mean_ai_answer_quality_score,
    n: w.n
  }));

  const notes: string[] = [
    "overall_ai_citation_score = mean per-row composite(likely*28 + quality*0.62 + structured*10)",
    "citation_ready_rate = share of queue rows with ai_answer_quality_score >= " + CITATION_READY_QUALITY_THRESHOLD,
    "V160.1: established topics (n >= min_samples_topic) drive full queue bonus; emerging lists are informational + reduced bonus",
    ...agg.confidence_weight_notes
  ];
  if (items.length < 8) notes.push("queue_small_V160_dominance_adjustments_skipped_in_publish_queue");

  return {
    version: AI_CITATION_DOMINANCE_VERSION,
    updatedAt: new Date().toISOString(),
    overall_ai_citation_score: agg.overall_ai_citation_score,
    min_sample_thresholds: th,
    confidence_weight_notes: agg.confidence_weight_notes,
    established_topic_count,
    emerging_topic_count,
    top_ai_citable_topics,
    emerging_ai_citable_topics,
    top_ai_citable_page_types,
    top_ai_citable_workflows,
    weak_topics,
    citation_ready_rate,
    avg_structured_content_ratio,
    notes,
    topic_performance: agg.topic_performance,
    page_type_performance: agg.page_type_performance,
    workflow_performance: agg.workflow_performance
  };
}

export function buildAssetSeoAutopilotSummaryFromDominance(
  dominance: AssetSeoAiCitationDominanceArtifact,
  items: AiCitationQueueItemLike[]
): AssetSeoAutopilotSummaryV160 {
  const bonusCount = items.filter((i) => (i.ai_citation_dominance_bonus ?? 0) > 0).length;
  const penaltyCount = items.filter((i) => (i.weak_ai_citation_penalty ?? 0) > 0).length;
  return {
    version: AI_CITATION_DOMINANCE_VERSION,
    updatedAt: new Date().toISOString(),
    citation_ready_rate: dominance.citation_ready_rate,
    top_ai_citable_topics: dominance.top_ai_citable_topics.map((t) => t.topic_key).slice(0, 12),
    emerging_ai_citable_topics: dominance.emerging_ai_citable_topics.map((t) => t.topic_key).slice(0, 12),
    overall_ai_citation_score: dominance.overall_ai_citation_score,
    ai_citation_dominance_bonus_count: bonusCount,
    weak_ai_citation_penalty_count: penaltyCount,
    queue_item_count: items.length,
    established_topic_count: dominance.established_topic_count,
    emerging_topic_count: dominance.emerging_topic_count,
    notes: ["Merged V160.1 citation dominance slice; full metrics in asset-seo-ai-citation-dominance.json"]
  };
}

export function writeAssetSeoAiCitationDominanceAndAutopilot(cwd: string, items: AiCitationQueueItemLike[]): void {
  const gen = resolveSeoGeneratedDir(cwd);
  fs.mkdirSync(gen, { recursive: true });
  const dominance = buildAssetSeoAiCitationDominanceArtifactFromQueueItems(items);
  const domPath = path.join(gen, "asset-seo-ai-citation-dominance.json");
  fs.writeFileSync(domPath, JSON.stringify(dominance, null, 2), "utf8");
  const autopilot = buildAssetSeoAutopilotSummaryFromDominance(dominance, items);
  const apPath = path.join(gen, "asset-seo-autopilot-summary.json");
  fs.writeFileSync(apPath, JSON.stringify(autopilot, null, 2), "utf8");
}

/** Standalone: read existing publish queue JSON and write dominance + autopilot (no rescoring). */
export function writeAssetSeoAiCitationDominanceFromQueueFile(cwd = process.cwd()): {
  dominancePath: string;
  autopilotPath: string;
  itemCount: number;
} {
  const gen = resolveSeoGeneratedDir(cwd);
  const queuePath = path.join(gen, "asset-seo-publish-queue.json");
  const data = readJson<{ items?: AiCitationQueueItemLike[] }>(queuePath, {});
  const items = Array.isArray(data.items) ? data.items : [];
  writeAssetSeoAiCitationDominanceAndAutopilot(cwd, items);
  return {
    dominancePath: path.join(gen, "asset-seo-ai-citation-dominance.json"),
    autopilotPath: path.join(gen, "asset-seo-autopilot-summary.json"),
    itemCount: items.length
  };
}
