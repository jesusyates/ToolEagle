/**
 * V162.1 — Browser-safe segment context from tool runtime signals (no queue artifacts).
 * Feeds buildSegmentStrategy; bounded trigger/CTA/conversion biases only.
 */

import type { AssetSeoRevenueSummaryArtifact } from "./asset-seo-revenue-summary";
import { normalizeTopicKey, topicRevenueScore } from "./asset-seo-revenue-intelligence";
import {
  buildSegmentStrategy,
  topicMatchesConversionSignals,
  topicMatchesHighRevenue,
  type SegmentStrategyContext,
  type SegmentStrategyResult
} from "./asset-seo-segment-strategy";

export type RuntimeSegmentStrategyInput = {
  lane: "zh" | "en";
  topic: string;
  workflow_id: string;
  /** tool | landing | etc. */
  page_type?: string;
  /** Query ?source= (e.g. ai_page) */
  entry_source?: string | null;
  intent?: string | null;
  monetization_tier: "high" | "medium" | "low";
  /** Count after this successful generation (>=1) */
  generation_index: number;
  lifetime_generation_count: number;
  retrieval_used: boolean;
  revenue_summary: AssetSeoRevenueSummaryArtifact | null;
};

function lowRevenuePenalty(topic: string, summary: AssetSeoRevenueSummaryArtifact | null): number {
  if (!summary?.underperforming_topics?.length) return 0;
  const t = normalizeTopicKey(topic) || topic.toLowerCase().trim();
  for (const u of summary.underperforming_topics) {
    const k = normalizeTopicKey(u.segment_key);
    if (k && (t.includes(k) || k.includes(t)) && u.conversion_rate < 0.015) return 4;
  }
  return 0;
}

/**
 * Map runtime tool fields to SegmentStrategyContext. Safe with partial data (fallbacks inside).
 */
export function buildRuntimeSegmentStrategyContext(input: RuntimeSegmentStrategyInput): SegmentStrategyContext {
  const topic = String(input.topic || "").trim() || "unknown";
  const summary = input.revenue_summary;
  const top = summary?.top_topics_by_revenue ?? [];
  const revScore = topicRevenueScore(topic, top);
  let revenue_priority_bonus = Math.round(Math.min(12, Math.max(0, revScore * 12)));
  if (input.monetization_tier === "high") revenue_priority_bonus = Math.min(12, revenue_priority_bonus + 2);
  if (input.monetization_tier === "low") revenue_priority_bonus = Math.max(0, revenue_priority_bonus - 2);

  const intent = String(input.intent || "").toLowerCase();
  const source = String(input.entry_source || "").toLowerCase();
  const repeat = input.generation_index >= 2 || input.lifetime_generation_count >= 4;

  let ai_citation_likely = input.retrieval_used ? 0.58 : 0.36;
  if (source === "ai_page") ai_citation_likely = Math.min(0.7, ai_citation_likely + 0.14);
  if (intent.includes("generate_now")) ai_citation_likely = Math.min(0.68, ai_citation_likely + 0.06);
  if (!source && input.generation_index <= 1 && !input.retrieval_used) {
    ai_citation_likely = Math.min(ai_citation_likely, 0.41);
  }
  if (source && source !== "ai_page" && input.generation_index <= 1 && !input.retrieval_used) {
    ai_citation_likely = Math.min(ai_citation_likely, 0.43);
  }

  let ai_citation_dominance_bonus = 0;
  if (input.retrieval_used && revScore > 0.32) ai_citation_dominance_bonus = 2;
  else if (input.retrieval_used) ai_citation_dominance_bonus = 1;
  if (source === "ai_page") ai_citation_dominance_bonus = Math.max(ai_citation_dominance_bonus, 1);

  const in_exploration_quota =
    input.generation_index <= 1 &&
    input.monetization_tier !== "high" &&
    (intent.includes("example") || intent.includes("wants_examples") || intent.length === 0);

  const emerging_citation_topic = in_exploration_quota && (input.retrieval_used || source === "ai_page");

  return {
    lane: input.lane,
    topic_key: topic,
    ai_citation_likely,
    ai_answer_quality_score: input.retrieval_used ? 64 : 52,
    structured_content_ratio: input.retrieval_used ? 0.17 : 0.09,
    ai_citation_dominance_bonus,
    weak_ai_citation_penalty: 0,
    revenue_priority_bonus,
    low_revenue_penalty: lowRevenuePenalty(topic, summary),
    in_exploration_quota,
    risk_deprioritize: false,
    high_revenue_signal: topicMatchesHighRevenue(topic, summary),
    high_conversion_match: topicMatchesConversionSignals(topic, summary),
    emerging_citation_topic
  };
}

export function buildRuntimeSegmentStrategy(input: RuntimeSegmentStrategyInput): SegmentStrategyResult {
  try {
    return buildSegmentStrategy(buildRuntimeSegmentStrategyContext(input));
  } catch {
    return buildSegmentStrategy({
      lane: input.lane,
      topic_key: String(input.topic || "unknown").trim() || "unknown"
    });
  }
}

/**
 * Bounded trigger nudge: discovery segments soften hard triggers; growth segments may upgrade soft→hard only when tier+repeat allow.
 * Does not replace deriveMonetizationTrigger — runs after it.
 */
export function applyRuntimeMonetizationTriggerBias(
  base: "soft" | "hard",
  strat: SegmentStrategyResult,
  opts: { monetization_tier: "high" | "medium" | "low"; generation_index: number }
): "soft" | "hard" {
  const light =
    strat.segment_key === "seo_discovery" ||
    strat.segment_key === "emerging_topic_exploration" ||
    strat.segment_key === "ai_citation_discovery";
  const strong = strat.segment_key === "high_intent_tool_entry" || strat.segment_key === "repeat_user_monetization";

  let t = base;
  if (t === "hard" && light) {
    t = "soft";
  }
  if (t === "soft" && strong && opts.monetization_tier === "high" && opts.generation_index >= 2) {
    t = "hard";
  }
  if (opts.generation_index <= 1 && light) {
    t = "soft";
  }
  return t;
}
