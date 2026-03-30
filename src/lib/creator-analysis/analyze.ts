/**
 * V191 — Orchestrates analyze-creator-content, infer-creator-profile, detect-content-issues,
 * monetization + focus scores, and legacy fields for downstream prompts.
 */

import manifest from "../../../generated/v191-creator-analysis-manifest.json";
import rules from "../../../generated/v191-analysis-rules.json";
import type { CreatorAnalysisInput, CreatorAnalysisOutput } from "@/lib/creator-analysis/types";
import { analyzeCreatorContent } from "@/lib/creator-analysis/analyze-creator-content";
import { aggregateContentMix } from "@/lib/creator-analysis/classify-content";
import { ctaCoverageAcrossItems } from "@/lib/creator-analysis/detect-cta";
import { blockForItem } from "@/lib/creator-analysis/extract-patterns";
import { detectContentIssues } from "@/lib/creator-analysis/detect-content-issues";
import { inferCreatorAccountProfile } from "@/lib/creator-analysis/infer-creator-profile";
import { countWords, extractTopKeywords, nicheEntropyScore } from "@/lib/creator-analysis/niche-cluster";
import { accountFocusScore, inferMonetizationReadiness } from "@/lib/creator-analysis/infer-monetization-tendency";

function archetypeLabel(mix: CreatorAnalysisOutput["content_mix"], sellingMix: number): string {
  const arch = manifest.creator_archetypes as { id: string; label: string }[];
  if (mix.tutorial + mix.listicle > 48 && sellingMix < 0.2) return arch.find((a) => a.id === "tutorial_educator")?.label ?? "Tutorial educator";
  if (mix.storytelling > 28) return arch.find((a) => a.id === "storyteller")?.label ?? "Story-first creator";
  if (mix.selling > 22 || sellingMix > 0.22) return arch.find((a) => a.id === "promo_commerce")?.label ?? "Commerce-forward";
  if (mix.opinion > 20) return arch.find((a) => a.id === "opinion_hot_take")?.label ?? "Opinion / commentary";
  return arch.find((a) => a.id === "mixed_generalist")?.label ?? "Mixed formats";
}

function avgTitleLen(items: CreatorAnalysisInput["pastContent"]): number {
  const lens = items.map((i) => (i.title ?? "").trim().length).filter((n) => n > 0);
  if (!lens.length) return 0;
  return lens.reduce((a, b) => a + b, 0) / lens.length;
}

function weaknessFromRules(
  ctaCoverage: number,
  nicheEnt: number,
  avgTitle: number,
  goal: CreatorAnalysisInput["accountGoal"],
  tutorialMix: number,
  sellingMix: number
): string[] {
  const wrules = rules.weakness_rules as { id: string; when: string; text: string }[];
  const out: string[] = [];
  for (const r of wrules) {
    let hit = false;
    if (r.when === "cta_coverage_lt_0.2" && ctaCoverage < 0.2) hit = true;
    if (r.when === "avg_title_len_lt_12" && avgTitle > 0 && avgTitle < 12) hit = true;
    if (r.when === "niche_entropy_gt_0.65" && nicheEnt > 0.65) hit = true;
    if (r.when === "goal_sales_and_selling_mix_lt_0.15" && goal === "sales" && sellingMix < 0.15) hit = true;
    if (r.when === "goal_views_and_tutorial_mix_lt_0.2" && (goal === "views" || goal === "followers") && tutorialMix < 0.2)
      hit = true;
    if (hit) out.push(r.text);
  }
  return out.slice(0, 4);
}

function strengthFromRules(
  ctaCoverage: number,
  nicheEnt: number,
  tutorialMix: number,
  storyMix: number
): string[] {
  const srules = rules.strength_rules as { id: string; when: string; text: string }[];
  const out: string[] = [];
  for (const r of srules) {
    let hit = false;
    if (r.when === "tutorial_mix_gt_0.45" && tutorialMix > 0.45) hit = true;
    if (r.when === "cta_coverage_gt_0.55" && ctaCoverage > 0.55) hit = true;
    if (r.when === "story_mix_gt_0.35" && storyMix > 0.35) hit = true;
    if (r.when === "niche_entropy_lt_0.45" && nicheEnt < 0.45) hit = true;
    if (hit) out.push(r.text);
  }
  return out.slice(0, 4);
}

function recommendations(
  goal: CreatorAnalysisInput["accountGoal"],
  mix: CreatorAnalysisOutput["content_mix"],
  weaknesses: string[]
): string[] {
  const r: string[] = [];
  if (goal === "sales" || goal === "mixed") {
    r.push("Run 1 proof-led post (before/after or demo) with a single CTA per week.");
  }
  if (mix.tutorial + mix.listicle < 35) {
    r.push("Add 2–3 repeatable tutorial or list posts that match your niche keywords.");
  } else {
    r.push("Keep tutorials, but test one strong story-style post to humanize the brand.");
  }
  if (weaknesses.some((w) => w.includes("next step"))) {
    r.push("End every post with one explicit action: comment keyword, save, or follow.");
  }
  return r.slice(0, 3);
}

function strategyLine(goal: CreatorAnalysisInput["accountGoal"], readiness: CreatorAnalysisOutput["monetization_readiness"]): string {
  if (goal === "views" || goal === "followers") {
    return "Prioritize posting frequency + one scroll-stopping hook per week; keep CTAs soft until retention is stable.";
  }
  if (goal === "sales" && readiness !== "low") {
    return "Alternate value posts with one direct offer post; track which CTA placement drives DMs or clicks.";
  }
  if (readiness === "low") {
    return "Build trust with tutorials and social proof first; introduce one light CTA every 3–4 posts.";
  }
  return "Balance discovery content (titles/hooks) with one conversion beat per post — comment, save, or link.";
}

export function runCreatorAnalysis(input: CreatorAnalysisInput): CreatorAnalysisOutput {
  const items = input.pastContent.filter((it) => {
    const b = blockForItem(it);
    return b.trim().length > 0;
  });

  if (items.length < 5) {
    throw new Error("Add at least 5 past posts with title, caption, or description.");
  }

  const nicheBlob = [input.niche, input.bio, input.positioning].filter(Boolean).join("\n");
  const blob = [nicheBlob, ...items.map(blockForItem)].join("\n");
  const topKw = extractTopKeywords(blob, 14);
  const wc = countWords(blob);
  const nicheEnt = nicheEntropyScore(topKw, wc);

  const textsPerItem = items.map((it) => {
    const b = blockForItem(it);
    return b + "\n" + (it.cta ?? "");
  });
  const ctaCoverage = ctaCoverageAcrossItems(textsPerItem);

  const { mix, selling_mix, tutorial_mix, story_mix } = aggregateContentMix(items);
  const avgTitle = avgTitleLen(items);

  const readiness = inferMonetizationReadiness({
    ctaCoverage,
    sellingMix: selling_mix,
    accountGoal: input.accountGoal
  });

  const focus = accountFocusScore({
    ctaCoverage,
    sellingMix: selling_mix,
    tutorialMix: tutorial_mix,
    accountGoal: input.accountGoal
  });

  const content = analyzeCreatorContent(items, nicheBlob);

  const profileMeta = inferCreatorAccountProfile({
    content,
    account_goal: input.accountGoal,
    account_focus_score: focus,
    monetization_readiness: readiness,
    post_count: items.length
  });

  const issues = detectContentIssues({
    content,
    account_goal: input.accountGoal,
    avg_title_len: avgTitle,
    niche_entropy: nicheEnt,
    tutorial_mix,
    selling_mix
  });

  let weaknesses = weaknessFromRules(ctaCoverage, nicheEnt, avgTitle, input.accountGoal, tutorial_mix, selling_mix);
  if (weaknesses.length === 0) {
    weaknesses = ["Keep testing hooks: even strong accounts can tighten the first line."];
  }

  let strengths = strengthFromRules(ctaCoverage, nicheEnt, tutorial_mix, story_mix);
  if (strengths.length === 0) strengths.push("You have enough samples to spot patterns — keep posting consistently.");
  strengths = strengths.slice(0, 3);

  const next_content_types = recommendations(input.accountGoal, mix, weaknesses);
  const short_strategy = strategyLine(input.accountGoal, readiness);
  const next_best_action =
    next_content_types[0] ??
    "Publish one post that uses a question hook in the first line and a single CTA at the end.";

  const creator_profile = `${archetypeLabel(mix, selling_mix)} on ${input.platform} — stage: ${profileMeta.creator_stage}.`;

  return {
    creator_profile,
    content_mix: mix,
    dominant_style: content.dominant_style,
    hook_distribution: content.hook_distribution,
    cta_usage: content.cta_usage,
    topic_consistency_score: content.topic_consistency_score,
    creator_stage: profileMeta.creator_stage,
    primary_focus: profileMeta.primary_focus,
    account_focus_score: focus,
    monetization_readiness: readiness,
    top_strengths: strengths,
    top_weaknesses: issues.map((i) => i.title),
    content_issues: issues.map((i) => ({ id: i.id, title: i.title, detail: i.detail })),
    next_content_types,
    next_best_action,
    short_strategy,
    next_content_recommendations: next_content_types,
    next_best_strategy: short_strategy,
    _signals: {
      cta_coverage: ctaCoverage,
      niche_entropy: nicheEnt,
      avg_hook_len: avgTitle,
      selling_mix,
      tutorial_mix,
      story_mix
    }
  };
}

export function validateAnalysisInput(input: CreatorAnalysisInput): string | null {
  const filled = input.pastContent.filter((it) => blockForItem(it).trim().length > 0);
  if (filled.length < 5) return "Add at least 5 past posts with title, caption, or description.";
  const missingTitleOrCaption = filled.filter((it) => !(it.title ?? "").trim() && !(it.caption ?? "").trim());
  if (missingTitleOrCaption.length > 0) {
    return "Each post needs at least a title or a caption (description alone is not enough).";
  }
  return null;
}
