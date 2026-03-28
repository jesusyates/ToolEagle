/**
 * V158 — Conversion path amplification from revenue signals (bounded; respects risk).
 */

import type { AssetSeoRevenueSummaryArtifact } from "./asset-seo-revenue-summary";
import { topicRevenueScore } from "./asset-seo-revenue-intelligence";
import { logAssetSeoConversionPath } from "./asset-seo-telemetry";
import type { PageBias, SegmentKey } from "./asset-seo-segment-strategy";

const MAX_BONUS_POINTS = 8;
const MAX_EXPOSURE = 1.22;
const MAX_CTA_FREQ = 3;
/** V162 — multiply revenue-derived knobs; clamped */
const SEGMENT_BIAS_MIN = 0.96;
const SEGMENT_BIAS_MAX = 1.04;
/** V163 — extra nudge on top of segment; tight clamp */
const ESCALATION_MULT_MIN = 0.985;
const ESCALATION_MULT_MAX = 1.035;

export type ConversionPathAmplification = {
  exposure_multiplier: number;
  cta_frequency_cap: number;
  bonus_points: number;
};

function readRiskDeprioritizeSet(riskCtx: { deprioritized_topic_prefixes?: string[] } | null): Set<string> {
  return new Set((riskCtx?.deprioritized_topic_prefixes || []).map((s) => String(s).toLowerCase()));
}

function topicTouchesRiskPrefix(topicKey: string, prefs: Set<string>): boolean {
  const t = topicKey.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  for (const p of prefs) {
    if (!p) continue;
    if (t.includes(p.replace(/[^a-z0-9-]+/g, ""))) return true;
  }
  return false;
}

/**
 * Safe amplification for workflows/topics with strong revenue (capped; damped under V156 risk).
 */
export type SegmentStrategyConversionBias = {
  segment_key: SegmentKey | string;
  recommended_allocation_weight: number;
  recommended_page_bias: PageBias;
};

export type IntentEscalationConversionBias = {
  recommended_nudge: string;
  escalation_strength: number;
};

export function computeConversionPathAmplification(input: {
  workflow_id: string;
  normalized_topic: string;
  page_type: string;
  revenueSummary: AssetSeoRevenueSummaryArtifact | null;
  /** From generated/seo-risk-context.json shape */
  riskContext?: { deprioritized_topic_prefixes?: string[] } | null;
  /** V162 — optional bounded nudge on exposure/bonus */
  segmentStrategy?: SegmentStrategyConversionBias | null;
  /** V163 — optional bounded refinement */
  intentEscalation?: IntentEscalationConversionBias | null;
}): ConversionPathAmplification {
  const prefs = readRiskDeprioritizeSet(input.riskContext ?? null);
  const riskDampen = topicTouchesRiskPrefix(input.normalized_topic, prefs) ? 0.55 : 1;

  const topTopics = input.revenueSummary?.top_topics_by_revenue ?? [];
  const score = topicRevenueScore(input.normalized_topic, topTopics);
  const wf = String(input.workflow_id || "").toLowerCase();
  const wfScore = wf && input.revenueSummary?.workflow_revenue_score ? input.revenueSummary.workflow_revenue_score[wf] ?? 0 : 0;
  const combined = Math.min(1, Math.max(score, wfScore * 0.95));

  let exposure_multiplier = 1 + combined * 0.18 * riskDampen;
  exposure_multiplier = Math.min(MAX_EXPOSURE, exposure_multiplier);

  let cta_frequency_cap = 1 + Math.round(combined * 2 * riskDampen);
  cta_frequency_cap = Math.min(MAX_CTA_FREQ, Math.max(1, cta_frequency_cap));

  let bonus_points = Math.round(combined * MAX_BONUS_POINTS * riskDampen);
  bonus_points = Math.min(MAX_BONUS_POINTS, Math.max(0, bonus_points));

  const seg = input.segmentStrategy;
  if (seg && Number.isFinite(seg.recommended_allocation_weight)) {
    let bias = Number(seg.recommended_allocation_weight);
    bias = Math.min(SEGMENT_BIAS_MAX, Math.max(SEGMENT_BIAS_MIN, bias));
    if (seg.recommended_page_bias === "tool_entry_first") {
      bias = Math.min(SEGMENT_BIAS_MAX, bias * 1.015);
    }
    if (seg.recommended_page_bias === "seo_first") {
      bias = Math.max(SEGMENT_BIAS_MIN, bias * 0.985);
    }
    exposure_multiplier = Math.min(MAX_EXPOSURE, exposure_multiplier * bias);
    bonus_points = Math.min(MAX_BONUS_POINTS, Math.max(0, Math.round(bonus_points * bias)));
  }

  const esc = input.intentEscalation;
  if (esc && (esc.escalation_strength ?? 0) > 0.2) {
    let m = 1 + Math.min(0.025, esc.escalation_strength * 0.04);
    if (esc.recommended_nudge === "reduce_friction" || esc.recommended_nudge === "prompt_generation") {
      m = Math.max(ESCALATION_MULT_MIN, m * 0.992);
    }
    if (esc.recommended_nudge === "monetization_surface" || esc.recommended_nudge === "conversion_emphasis") {
      m = Math.min(ESCALATION_MULT_MAX, m * 1.008);
    }
    m = Math.min(ESCALATION_MULT_MAX, Math.max(ESCALATION_MULT_MIN, m));
    exposure_multiplier = Math.min(MAX_EXPOSURE, exposure_multiplier * m);
    bonus_points = Math.min(MAX_BONUS_POINTS, Math.max(0, Math.round(bonus_points * m)));
  }

  return {
    exposure_multiplier: Number(exposure_multiplier.toFixed(3)),
    cta_frequency_cap,
    bonus_points
  };
}

export function logConversionPathRevenueAmplification(input: {
  workflow_id: string;
  normalized_topic: string;
  page_type: string;
  amp: ConversionPathAmplification;
  revenue_tier: string;
}): void {
  logAssetSeoConversionPath({
    event: "conversion_bonus_applied",
    conversion_path_ready: true,
    primary_conversion_target: input.workflow_id,
    secondary_conversion_target: input.normalized_topic,
    page_type: input.page_type,
    workflow_id: input.workflow_id,
    normalized_topic: input.normalized_topic,
    bonus_points: input.amp.bonus_points,
    exposure_multiplier: input.amp.exposure_multiplier,
    cta_frequency_cap: input.amp.cta_frequency_cap,
    revenue_tier: input.revenue_tier
  });
}
