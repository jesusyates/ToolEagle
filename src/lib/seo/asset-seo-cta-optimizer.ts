/**
 * V158 — Revenue-aware CTA variant selection (soft vs hard, variant id).
 * Does not replace safety / quality gates; only biases choice within allowed pools.
 */

import type { MonetizationVariant } from "./asset-seo-monetization-variants";
import { MONETIZATION_VARIANTS, pickVariantDeterministic, variantsForTrigger } from "./asset-seo-monetization-variants";
import type { AssetSeoRevenueSummaryArtifact } from "./asset-seo-revenue-summary";
import { normalizeTopicKey, topicRevenueScore, type RevenueSegmentMetrics } from "./asset-seo-revenue-intelligence";
import type { CtaStyle, MonetizationRole, SegmentKey } from "./asset-seo-segment-strategy";

export type CtaRevenueTier = "high" | "medium" | "low" | "unknown";

export type RevenueAwareCtaSelection = {
  variant: MonetizationVariant;
  trigger_type: "soft" | "hard";
  revenue_tier: CtaRevenueTier;
  /** Stronger CTA = hard + v3/v4 bias */
  strength: "strong" | "neutral" | "soft";
};

function tierFromScore(score: number, lowTopic: boolean): CtaRevenueTier {
  if (lowTopic) return "low";
  if (score >= 0.55) return "high";
  if (score >= 0.22) return "medium";
  return "unknown";
}

function isLowValueTopic(topicKey: string, underperforming: RevenueSegmentMetrics[]): boolean {
  const t = normalizeTopicKey(topicKey);
  for (const u of underperforming) {
    const k = normalizeTopicKey(u.segment_key);
    if (k && (t.includes(k) || k.includes(t))) return true;
  }
  return false;
}

/**
 * Pick CTA variant using revenue summary + base trigger type from monetization engine.
 */
export type SegmentStrategyCtaBias = {
  segment_key: SegmentKey | string;
  recommended_cta_style: CtaStyle;
  monetization_role: MonetizationRole;
};

export type IntentEscalationCtaBias = {
  recommended_nudge: string;
  escalation_strength: number;
};

export function selectCtaVariantWithRevenueContext(input: {
  topicKey: string;
  workflowId?: string | null;
  baseTriggerType: "soft" | "hard";
  revenueSummary: AssetSeoRevenueSummaryArtifact | null;
  seed: string;
  /** V162 — optional; biases within allowed trigger/variant pools */
  segmentStrategy?: SegmentStrategyCtaBias | null;
  /** V163 — optional; bounded vs segment; requires generationIndex for strong monetization nudge */
  intentEscalation?: IntentEscalationCtaBias | null;
  generationIndex?: number;
}): RevenueAwareCtaSelection {
  const topTopics = input.revenueSummary?.top_topics_by_revenue ?? [];
  const under = input.revenueSummary?.underperforming_topics ?? [];
  const lowTopic = isLowValueTopic(input.topicKey, under);
  let score = topicRevenueScore(input.topicKey, topTopics);
  const wf = String(input.workflowId || "").toLowerCase();
  if (wf && input.revenueSummary?.workflow_revenue_score) {
    const wfScore = input.revenueSummary.workflow_revenue_score[wf] ?? 0;
    score = Math.max(score, wfScore * 0.9);
  }
  const tier = tierFromScore(score, lowTopic);

  let trigger_type: "soft" | "hard" = input.baseTriggerType;
  if (tier === "high" && input.baseTriggerType === "soft") {
    trigger_type = "hard";
  }
  if (tier === "low") {
    trigger_type = "soft";
  }

  const seg = input.segmentStrategy;
  if (seg?.recommended_cta_style === "minimal") {
    trigger_type = "soft";
  } else if (seg?.recommended_cta_style === "strong" && tier !== "low") {
    if (tier === "high" || (tier === "medium" && seg.monetization_role === "growth")) {
      trigger_type = "hard";
    }
  }

  const ie = input.intentEscalation;
  const genIdx = input.generationIndex ?? 0;
  if (ie && (ie.escalation_strength ?? 0) >= 0.3) {
    if (ie.recommended_nudge === "reduce_friction" || ie.recommended_nudge === "prompt_generation") {
      trigger_type = "soft";
    }
  }
  if (
    ie?.recommended_nudge === "monetization_surface" &&
    (ie.escalation_strength ?? 0) >= 0.48 &&
    tier === "high" &&
    genIdx >= 2
  ) {
    trigger_type = "hard";
  }

  const pool = variantsForTrigger(trigger_type);
  let variant: MonetizationVariant;

  if (tier === "high") {
    const hardish = pool.find((v) => v.id === "v4") ?? pool.find((v) => v.id === "v3") ?? pool[0];
    variant = hardish ?? pickVariantDeterministic(input.seed, trigger_type);
  } else if (tier === "low") {
    const softish = pool.find((v) => v.id === "v1") ?? pool.find((v) => v.id === "v2") ?? pool[0];
    variant = softish ?? pickVariantDeterministic(input.seed, trigger_type);
  } else {
    variant = pickVariantDeterministic(input.seed, trigger_type);
  }

  if (!pool.some((v) => v.id === variant.id)) {
    variant = pickVariantDeterministic(input.seed, trigger_type);
  }

  const strength: RevenueAwareCtaSelection["strength"] =
    tier === "high" ? "strong" : tier === "low" ? "soft" : "neutral";

  return { variant, trigger_type, revenue_tier: tier, strength };
}

export function resolveVariantById(id: string): MonetizationVariant | null {
  return MONETIZATION_VARIANTS.find((v) => v.id === id) ?? null;
}
