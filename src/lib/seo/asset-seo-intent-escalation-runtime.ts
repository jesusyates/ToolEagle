/**
 * V163.1 — Browser-safe intent escalation from tool runtime (pairs with V162 segment runtime).
 */

import {
  buildIntentEscalationPlan,
  type IntentEscalationContext,
  type IntentEscalationPlan
} from "./asset-seo-intent-escalation";
import { topicMatchesConversionSignals, topicMatchesHighRevenue } from "./asset-seo-segment-strategy";
import type { AssetSeoRevenueSummaryArtifact } from "./asset-seo-revenue-summary";
import { topicRevenueScore } from "./asset-seo-revenue-intelligence";

export type RuntimeIntentEscalationInput = {
  lane: "zh" | "en";
  topic: string;
  workflow_id: string;
  entry_source?: string | null;
  intent?: string | null;
  monetization_tier: "high" | "medium" | "low";
  generation_index: number;
  lifetime_generation_count: number;
  value_delivered: boolean;
  retrieval_used: boolean;
  ai_citation_likely_hint?: number;
  ai_citation_dominance_bonus_hint?: number;
  revenue_summary: AssetSeoRevenueSummaryArtifact | null;
};

export function buildRuntimeIntentEscalationContext(input: RuntimeIntentEscalationInput): IntentEscalationContext {
  const topic = String(input.topic || "").trim() || "unknown";
  const top = input.revenue_summary?.top_topics_by_revenue ?? [];
  const revScore = topicRevenueScore(topic, top);
  const revenue_priority_bonus = Math.round(Math.min(12, Math.max(0, revScore * 12)));

  let low_revenue_penalty = 0;
  const under = input.revenue_summary?.underperforming_topics ?? [];
  const t = topic.toLowerCase();
  for (const u of under) {
    const k = String(u.segment_key || "").toLowerCase();
    if (k && (t.includes(k) || k.includes(t)) && u.conversion_rate < 0.015) {
      low_revenue_penalty = 4;
      break;
    }
  }

  const cit =
    input.ai_citation_likely_hint ??
    (input.retrieval_used ? 0.58 : input.entry_source === "ai_page" ? 0.55 : 0.38);

  return {
    lane: input.lane,
    topic_key: topic,
    ai_citation_likely: cit,
    ai_citation_dominance_bonus: input.ai_citation_dominance_bonus_hint ?? (input.retrieval_used ? 2 : 0),
    weak_ai_citation_penalty: 0,
    revenue_priority_bonus,
    low_revenue_penalty,
    monetization_tier: input.monetization_tier,
    generation_count: input.generation_index,
    lifetime_generation_count: input.lifetime_generation_count,
    value_delivered: input.value_delivered,
    retrieval_used: input.retrieval_used,
    entry_source: input.entry_source,
    intent: input.intent,
    high_revenue_signal: topicMatchesHighRevenue(topic, input.revenue_summary),
    high_conversion_match: topicMatchesConversionSignals(topic, input.revenue_summary)
  };
}

export function buildRuntimeIntentEscalationPlan(input: RuntimeIntentEscalationInput): IntentEscalationPlan {
  try {
    const ctx = buildRuntimeIntentEscalationContext(input);
    const strength =
      input.value_delivered && input.generation_index >= 2 ? 0.62 : input.value_delivered ? 0.48 : 0.38;
    return buildIntentEscalationPlan(ctx, strength);
  } catch {
    return buildIntentEscalationPlan({ lane: input.lane, topic_key: String(input.topic || "unknown") }, 0);
  }
}

export function runtimeEscalationFirstUse(plan: IntentEscalationPlan, generationIndex: number): boolean {
  return generationIndex <= 1 && plan.current_intent_state === "seo_discovery";
}
