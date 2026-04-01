import type { CreatorState } from "@/lib/content/creator-state";

export function scoreCreatorStateApply(state: CreatorState): {
  applyScore: number;
  level: "weak" | "medium" | "strong";
} {
  let applyScore = 0;
  if (state.stage) applyScore += 10;
  if (state.priority) applyScore += 10;
  if (state.focus?.trim()) applyScore += 15;
  if ((state.problems?.length ?? 0) >= 3) applyScore += 20;
  if ((state.actions?.length ?? 0) >= 2) applyScore += 20;
  if (typeof state.strategy?.hashtagCount === "number" && state.strategy.hashtagCount > 0) applyScore += 10;
  if (state.strategy?.captionLengthType) applyScore += 10;
  if ((state.strategy?.topHooks?.length ?? 0) >= 1) applyScore += 5;
  applyScore = Math.max(0, Math.min(100, applyScore));
  const level: "weak" | "medium" | "strong" =
    applyScore <= 39 ? "weak" : applyScore <= 69 ? "medium" : "strong";
  return { applyScore, level };
}

