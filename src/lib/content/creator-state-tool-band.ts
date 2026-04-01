export function classifyCreatorStateToolWeight(weightScore: number): {
  band: "strong" | "medium" | "weak" | "empty";
} {
  if (weightScore >= 80) return { band: "strong" };
  if (weightScore >= 40) return { band: "medium" };
  if (weightScore >= 1) return { band: "weak" };
  return { band: "empty" };
}

