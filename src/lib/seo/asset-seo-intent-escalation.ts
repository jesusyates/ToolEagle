/**
 * V163 — Intent escalation ladder (refines V162 segment strategy; does not replace safety caps).
 */

export const INTENT_ESCALATION_VERSION = "v163.0";

export type IntentState =
  | "seo_discovery"
  | "ai_citation_discovery"
  | "high_intent_tool_entry"
  | "generation_ready"
  | "repeat_user_monetization";

export type RecommendedNudge =
  | "none"
  | "reduce_friction"
  | "prompt_generation"
  | "conversion_emphasis"
  | "monetization_surface";

export type IntentEscalationContext = {
  lane: "zh" | "en";
  topic_key: string;
  ai_citation_likely?: number;
  ai_citation_dominance_bonus?: number;
  weak_ai_citation_penalty?: number;
  revenue_priority_bonus?: number;
  low_revenue_penalty?: number;
  monetization_tier?: "high" | "medium" | "low";
  generation_count?: number;
  lifetime_generation_count?: number;
  value_delivered?: boolean;
  retrieval_used?: boolean;
  entry_source?: string | null;
  intent?: string | null;
  high_revenue_signal?: boolean;
  high_conversion_match?: boolean;
};

export type IntentEscalationPlan = {
  current_intent_state: IntentState;
  next_intent_state: IntentState;
  escalation_reason: string;
  recommended_nudge: RecommendedNudge;
  /** 0.15–0.95 when nudging; 0 when none */
  escalation_strength: number;
};

/** Classify current rung from signals (queue-safe: omit value_delivered → no generation_ready/repeat from delivery). */
export function classifyCurrentIntentState(ctx: IntentEscalationContext): IntentState {
  const gen = Math.max(0, ctx.generation_count ?? 0);
  const life = Math.max(0, ctx.lifetime_generation_count ?? 0);
  const vd = ctx.value_delivered === true;
  const tier = ctx.monetization_tier ?? "medium";
  const cit = ctx.ai_citation_likely ?? 0;
  const dom = ctx.ai_citation_dominance_bonus ?? 0;
  const weak = (ctx.weak_ai_citation_penalty ?? 0) > 0;
  const revB = ctx.revenue_priority_bonus ?? 0;
  const lowPen = ctx.low_revenue_penalty ?? 0;
  const zh = ctx.lane === "zh";
  const en = ctx.lane === "en";
  const intent = String(ctx.intent || "").toLowerCase();
  const src = String(ctx.entry_source || "").toLowerCase();

  if (vd && (gen >= 2 || (life >= 4 && tier === "high")) && (ctx.high_conversion_match || tier === "high")) {
    return "repeat_user_monetization";
  }
  if (vd && gen >= 1) {
    return "generation_ready";
  }

  if (
    ctx.high_revenue_signal ||
    revB >= 8 ||
    (en && revB >= 6) ||
    tier === "high" ||
    intent.includes("generate_now")
  ) {
    return "high_intent_tool_entry";
  }

  if (cit >= 0.52 && dom > 0 && !weak) {
    return "ai_citation_discovery";
  }
  if (src === "ai_page" || ctx.retrieval_used) {
    return "ai_citation_discovery";
  }

  if (zh && cit < 0.48 && lowPen === 0) {
    return "seo_discovery";
  }
  if (!src && !ctx.retrieval_used && gen === 0) {
    return "seo_discovery";
  }

  return "high_intent_tool_entry";
}

export function computeNextIntentState(ctx: IntentEscalationContext, current: IntentState): IntentState {
  const gen = ctx.generation_count ?? 0;
  const vd = ctx.value_delivered === true;
  const tier = ctx.monetization_tier ?? "medium";

  switch (current) {
    case "seo_discovery":
      if (ctx.retrieval_used || String(ctx.entry_source || "").toLowerCase().includes("ai")) {
        return "ai_citation_discovery";
      }
      return current;
    case "ai_citation_discovery":
      if (tier === "high" || ctx.high_revenue_signal || (ctx.revenue_priority_bonus ?? 0) >= 6) {
        return "high_intent_tool_entry";
      }
      return current;
    case "high_intent_tool_entry":
      if (vd && gen >= 1) return "generation_ready";
      return current;
    case "generation_ready":
      if (gen >= 2 && vd && (tier === "high" || ctx.high_conversion_match === true)) {
        return "repeat_user_monetization";
      }
      return current;
    case "repeat_user_monetization":
    default:
      return current;
  }
}

function nudgeForTransition(from: IntentState, to: IntentState, strengthBase: number): IntentEscalationPlan {
  if (from === to) {
    return {
      current_intent_state: from,
      next_intent_state: to,
      escalation_reason: "stable_intent",
      recommended_nudge: "none",
      escalation_strength: 0
    };
  }
  let nudge: RecommendedNudge = "none";
  let reason = "progress_ladder";
  if (to === "ai_citation_discovery" || from === "seo_discovery") {
    nudge = "reduce_friction";
    reason = "surface_citation_value";
  } else if (to === "high_intent_tool_entry") {
    nudge = "prompt_generation";
    reason = "intent_and_revenue_signals";
  } else if (to === "generation_ready") {
    nudge = "conversion_emphasis";
    reason = "value_delivered";
  } else if (to === "repeat_user_monetization") {
    nudge = "monetization_surface";
    reason = "repeat_high_value_session";
  }
  const escalation_strength = Number(Math.min(0.95, Math.max(0.2, strengthBase)).toFixed(2));
  return {
    current_intent_state: from,
    next_intent_state: to,
    escalation_reason: reason,
    recommended_nudge: nudge,
    escalation_strength
  };
}

export function buildIntentEscalationPlan(ctx: IntentEscalationContext, strengthBase = 0.45): IntentEscalationPlan {
  const current = classifyCurrentIntentState(ctx);
  const next = computeNextIntentState(ctx, current);
  return nudgeForTransition(current, next, strengthBase);
}

/** Bounded offset for monetization timing threshold (1–3). */
export function escalationTimingOffset(
  plan: IntentEscalationPlan,
  generationCount: number,
  firstSessionGen: boolean
): -1 | 0 | 1 {
  if (firstSessionGen || generationCount <= 1) return 0;
  if (plan.recommended_nudge === "reduce_friction" || plan.current_intent_state === "seo_discovery") {
    return 1;
  }
  if (
    plan.recommended_nudge === "monetization_surface" &&
    plan.escalation_strength >= 0.45 &&
    generationCount >= 2
  ) {
    return -1;
  }
  return 0;
}

export function escalationPreferredTriggerType(plan: IntentEscalationPlan): "soft" | "hard" | undefined {
  if (plan.recommended_nudge === "reduce_friction") return "soft";
  if (plan.recommended_nudge === "monetization_surface" && plan.escalation_strength >= 0.55) return "hard";
  return undefined;
}
