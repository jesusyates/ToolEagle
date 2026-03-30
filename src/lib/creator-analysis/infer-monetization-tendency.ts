import type { AccountGoal, MonetizationReadinessLevel } from "@/lib/creator-analysis/types";

export function inferMonetizationReadiness(args: {
  ctaCoverage: number;
  sellingMix: number;
  accountGoal: AccountGoal;
}): MonetizationReadinessLevel {
  const { ctaCoverage, sellingMix, accountGoal } = args;
  let score = 0;
  score += Math.min(1, ctaCoverage) * 3;
  score += Math.min(1, sellingMix) * 2;
  if (accountGoal === "sales") score += 1.2;
  if (accountGoal === "mixed") score += 0.5;
  if (accountGoal === "followers") score += 0.2;
  if (score >= 3.2) return "high";
  if (score >= 1.8) return "medium";
  return "low";
}

/** 0–100: higher = prioritize conversion / monetization experiments */
export function accountFocusScore(args: {
  ctaCoverage: number;
  sellingMix: number;
  tutorialMix: number;
  accountGoal: AccountGoal;
}): number {
  const { ctaCoverage, sellingMix, tutorialMix, accountGoal } = args;
  let s = ctaCoverage * 38 + sellingMix * 42 + (1 - tutorialMix / 100) * 10;
  if (accountGoal === "sales") s += 18;
  if (accountGoal === "mixed") s += 8;
  if (accountGoal === "followers") s += 4;
  if (accountGoal === "views") s -= 6;
  return Math.max(0, Math.min(100, Math.round(s)));
}
