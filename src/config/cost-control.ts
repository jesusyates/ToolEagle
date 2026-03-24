export type ModelTier = "low_cost" | "standard" | "high_cost";

export const COST_CONTROL_CONFIG = {
  model: {
    lowCostModel: process.env.OPENAI_LOW_COST_MODEL?.trim() || "gpt-4o-mini",
    standardModel: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
    highCostModel: process.env.OPENAI_HIGH_COST_MODEL?.trim() || "gpt-4o",
    enableHighCostForPaid: (process.env.ENABLE_HIGH_COST_MODEL_FOR_PAID || "").toLowerCase() === "true"
  },
  maxTokens: {
    free: 1800,
    paid: 4800,
    paidFullPack: 7000,
    highRiskCap: 1400
  },
  maxVariations: {
    free: 3,
    paid: 10,
    highRisk: 2
  },
  perRequestGuard: {
    maxEstimatedUsd: Number(process.env.COST_GUARD_MAX_ESTIMATED_USD || "0.08"),
    lowCostPer1k: 0.002,
    standardPer1k: 0.01,
    highCostPer1k: 0.03
  }
} as const;

