/**
 * V191 — Account-level profile from analysis signals (heuristic).
 */

import type {
  AccountGoal,
  ContentMix,
  CreatorStageV191,
  MonetizationReadinessLevel,
  PrimaryFocusV191
} from "@/lib/creator-analysis/types";
import type { AnalyzeCreatorContentResult } from "@/lib/creator-analysis/analyze-creator-content";

export type InferredCreatorAccountProfile = {
  creator_stage: CreatorStageV191;
  primary_focus: PrimaryFocusV191;
  monetization_readiness: MonetizationReadinessLevel;
};

type InferArgs = {
  content: Pick<AnalyzeCreatorContentResult, "content_mix" | "cta_usage" | "topic_consistency_score">;
  account_goal: AccountGoal;
  /** 0–100 conversion-lean score from infer-monetization-tendency */
  account_focus_score: number;
  monetization_readiness: MonetizationReadinessLevel;
  post_count: number;
};

function maxMixPct(mix: ContentMix): number {
  return Math.max(mix.tutorial, mix.storytelling, mix.selling, mix.opinion, mix.listicle, mix.other);
}

/**
 * Stage: consistency + format focus + monetization signals.
 * Primary focus: goal + focus score + selling/CTA mix.
 */
export function inferCreatorAccountProfile(args: InferArgs): InferredCreatorAccountProfile {
  const { content, account_goal, account_focus_score, monetization_readiness, post_count } = args;
  const mix = content.content_mix;
  const { cta_usage, topic_consistency_score: tcs } = content;

  const scatter = maxMixPct(mix) < 24 && mix.other < 35;
  const sellingLean = mix.selling + mix.listicle * 0.2 > 20;
  const beginnerSignal =
    tcs < 38 || scatter || (post_count < 6 && tcs < 50 && maxMixPct(mix) < 30);

  const monetizingSignal =
    monetization_readiness === "high" ||
    (monetization_readiness === "medium" && sellingLean && cta_usage.coverage >= 0.45);

  let creator_stage: CreatorStageV191;
  if (monetizingSignal && tcs >= 42) creator_stage = "monetizing";
  else if (beginnerSignal) creator_stage = "beginner";
  else creator_stage = "growing";

  let primary_focus: PrimaryFocusV191 = "growth";
  if (account_focus_score >= 56) primary_focus = "conversion";
  else if (account_focus_score <= 42) primary_focus = "growth";
  else {
    if (account_goal === "sales") primary_focus = "conversion";
    else if (account_goal === "views" || account_goal === "followers") primary_focus = "growth";
    else primary_focus = sellingLean ? "conversion" : "growth";
  }

  return {
    creator_stage,
    primary_focus,
    monetization_readiness
  };
}
