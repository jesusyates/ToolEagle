export type MonetizationPotential = {
  monetization_score: number;
  monetization_tier: "high" | "medium" | "low";
};

export function computeMonetizationPotential(input: {
  conversion_score: number;
  generation_start_rate: number;
  intent: string;
  retrieval_share: number;
}): MonetizationPotential {
  const intentNorm = String(input.intent || "").toLowerCase();
  const intentBoost =
    intentNorm === "wants_to_generate_now" ? 0.18 : intentNorm === "wants_examples" ? 0.08 : 0.03;
  const scoreRaw =
    Number(input.conversion_score || 0) * 0.4 +
    Number(input.generation_start_rate || 0) * 0.35 +
    Number(input.retrieval_share || 0) * 0.15 +
    intentBoost;
  const score = Number(Math.max(0, Math.min(1, scoreRaw)).toFixed(4));
  const tier: "high" | "medium" | "low" = score >= 0.62 ? "high" : score >= 0.34 ? "medium" : "low";
  return { monetization_score: score, monetization_tier: tier };
}

