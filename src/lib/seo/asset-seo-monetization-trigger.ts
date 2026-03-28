export type MonetizationTrigger = {
  trigger_type: "none" | "soft" | "hard";
  trigger_message: string;
  trigger_position: "post_generate" | "mid_generate" | "repeat_use";
};

export function deriveMonetizationTrigger(context: {
  monetization_tier: "high" | "medium" | "low";
  generation_count: number;
  value_delivered: boolean;
  best_trigger_timing?: 1 | 2 | 3;
  strategy?: {
    best_trigger_timing?: 1 | 2 | 3;
    preferred_trigger_type?: "soft" | "hard";
  };
}): MonetizationTrigger {
  // Safety: no trigger before value is delivered.
  if (!context.value_delivered) {
    return { trigger_type: "none", trigger_message: "", trigger_position: "post_generate" };
  }
  if (context.monetization_tier === "low") {
    return { trigger_type: "none", trigger_message: "", trigger_position: "post_generate" };
  }
  const bestTiming = context.strategy?.best_trigger_timing ?? context.best_trigger_timing ?? 2;
  const preferredType = context.strategy?.preferred_trigger_type;
  if (
    (preferredType === "hard" || context.monetization_tier === "high") &&
    context.generation_count >= bestTiming
  ) {
    return {
      trigger_type: "hard",
      trigger_message: "You are getting strong results. Unlock full packages and faster iterations with Pro.",
      trigger_position: "repeat_use"
    };
  }
  return {
    trigger_type: "soft",
    trigger_message: "Want more variations and deeper optimization? Upgrade for full output.",
    trigger_position: "post_generate"
  };
}

