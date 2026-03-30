/**
 * V191 — Exactly three concrete, actionable issue lines (rules + signals).
 */

import type { AccountGoal, ContentMix } from "@/lib/creator-analysis/types";
import type { AnalyzeCreatorContentResult, HookTypeKey } from "@/lib/creator-analysis/analyze-creator-content";

export type ContentIssueV191 = {
  id: string;
  /** Short label for UI */
  title: string;
  /** Specific explanation tied to signals */
  detail: string;
};

type DetectArgs = {
  content: AnalyzeCreatorContentResult;
  account_goal: AccountGoal;
  /** average title length when present */
  avg_title_len: number;
  niche_entropy: number;
  tutorial_mix: number;
  selling_mix: number;
};

function sortHooks(hook_distribution: Record<HookTypeKey, number>): HookTypeKey[] {
  const keys = Object.keys(hook_distribution) as HookTypeKey[];
  return keys.sort((a, b) => hook_distribution[b] - hook_distribution[a]);
}

/**
 * Returns exactly 3 issues; each detail references a measurable pattern.
 */
export function detectContentIssues(args: DetectArgs): ContentIssueV191[] {
  const { content, account_goal, avg_title_len, niche_entropy, tutorial_mix, selling_mix } = args;
  const { hook_distribution, cta_usage, topic_consistency_score, content_mix } = content;

  const pool: ContentIssueV191[] = [];

  const topHooks = sortHooks(hook_distribution);
  const weakHook =
    (hook_distribution.none ?? 0) >= 28 ||
    (hook_distribution.question + hook_distribution.curiosity + hook_distribution.list < 22 && hook_distribution.none >= 18);
  if (weakHook) {
    pool.push({
      id: "hook_weak",
      title: "Opening lines do not vary or stop the scroll",
      detail: `Most openers read as generic or blank: ${Math.round(hook_distribution.none ?? 0)}% map to “no clear hook pattern” (question/curiosity/list are underused).`
    });
  }

  const dispersed =
    Math.max(
      content_mix.tutorial,
      content_mix.storytelling,
      content_mix.selling,
      content_mix.opinion,
      content_mix.listicle
    ) < 32;
  if (dispersed || niche_entropy > 0.62) {
    pool.push({
      id: "format_scatter",
      title: "Content format is too scattered for the algorithm to “learn” you",
      detail: `Topic consistency is ${topic_consistency_score}/100 and niche entropy is high — viewers get mixed signals about what you always post.`
    });
  }

  if (cta_usage.coverage < 0.22) {
    pool.push({
      id: "cta_missing",
      title: "CTA is missing on most posts",
      detail: `Only ${cta_usage.posts_with_cta} of ${cta_usage.posts_with_cta + cta_usage.posts_without_cta} sampled posts include a recognizable CTA phrase — saves/comments/links rarely get asked for.`
    });
  } else if (cta_usage.coverage > 0.78 && account_goal === "views" && selling_mix < 0.12) {
    pool.push({
      id: "cta_early_for_goal",
      title: "Heavy CTA while the stated goal is reach",
      detail: `CTA shows up on ~${Math.round(cta_usage.coverage * 100)}% of posts but selling/tutorial mix is low — you may be asking before the hook earns attention.`
    });
  }

  if (avg_title_len > 0 && avg_title_len < 14) {
    pool.push({
      id: "thin_titles",
      title: "Titles or first lines are too thin to test CTR",
      detail: `Average title/first-line length is ~${avg_title_len.toFixed(0)} characters — too short to carry a clear promise or curiosity gap.`
    });
  }

  if (account_goal === "sales" && selling_mix < 0.14 && tutorial_mix > 0.38) {
    pool.push({
      id: "sales_mismatch",
      title: "Sales goal but posts read mostly educational",
      detail: `Selling-style posts are a small slice of the mix while tutorials dominate — add proof, offers, or demos on a regular cadence.`
    });
  }

  if (account_goal === "views" && content_mix.tutorial + content_mix.listicle < 28) {
    pool.push({
      id: "discovery_mismatch",
      title: "Reach goal but few repeatable discovery formats",
      detail: `Lists/tips/tutorials add up to under ~${Math.round(content_mix.tutorial + content_mix.listicle)}% — add more save-worthy structured posts for discovery.`
    });
  }

  if (pool.length < 3) {
    pool.push({
      id: "hook_test_default",
      title: "Hooks are not being A/B tested systematically",
      detail: `Rotate two hook types weekly (e.g. question vs list) and keep the winner’s structure — current mix doesn’t show a dominant test pattern.`
    });
  }

  const seen = new Set<string>();
  const out: ContentIssueV191[] = [];
  for (const p of pool) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
    if (out.length >= 3) break;
  }
  let pad = 0;
  while (out.length < 3) {
    pad += 1;
    out.push({
      id: `fallback_${pad}`,
      title: "Retention beats volume when hooks are unproven",
      detail: "Posting often helps, but without one repeated winning format, the feed can’t compound — pick one structure for the next 5 posts."
    });
  }
  return out.slice(0, 3);
}
