/**
 * V188 — Short takeover lines (intent-driven, not generic).
 * V189 — Band-aware body copy (must differ by stage).
 */

import type { CreatorScoreBand } from "@/lib/creator-guidance/compute-creator-score";

export function takeoverSubline(intentId: string): string {
  const i = intentId.toLowerCase();
  if (i.includes("story")) return "Story-first: open with tension, pay off with one clear takeaway.";
  if (i.includes("shop") || i.includes("promote")) return "Selling: lead with the problem, show proof, then CTA.";
  if (i.includes("viral") || i.includes("views")) return "Growth: pattern-interrupt + curiosity gap in line one.";
  if (i.includes("tutorial")) return "Tutorial: promise one outcome viewers can verify fast.";
  return "Aligned to your selected intent — generate, then follow the next-step card.";
}

export function takeoverPrimaryLabel(toolSlug: string): string {
  if (toolSlug === "hook-generator") return "Generate hooks";
  if (toolSlug === "tiktok-caption-generator") return "Generate post packages";
  if (toolSlug === "hashtag-generator") return "Generate hashtag sets";
  if (toolSlug === "title-generator") return "Generate titles";
  return "Generate";
}

/** V189 — Coaching line under intent; changes by score band so users don’t see identical guidance. */
export function takeoverCoachingForBand(
  band: CreatorScoreBand,
  stageTitle: string,
  nextBest: string
): string {
  switch (band) {
    case "beginner":
      return `You’re in “${stageTitle}”: focus on the next tool in the chain — ${nextBest}`;
    case "rising":
      return `Habit-building phase — reuse intent + scenario, then ${nextBest.toLowerCase()}`;
    case "active":
      return `Efficiency mode: tighten one weak step per run. Suggested: ${nextBest}`;
    case "advanced":
      return `Growth & leverage — ${nextBest} Test what compounds (hooks + titles), not more random topics.`;
    default:
      return nextBest;
  }
}
