/**
 * V190 — Monetization profile from V187 memory + V189 score + V187 inferred profile (behavior-only).
 * Future: Knowledge Engine can call `getMonetizationModeForKnowledgeEngine` to bias patterns/recipes.
 * Server-side monetization / revenue intel (V180+ asset SEO layer) can be merged into scoring later — not required for v1.
 */

import type { CreatorMemoryV187 } from "@/lib/creator-guidance/creator-memory-store";
import type { CreatorScoreResult } from "@/lib/creator-guidance/compute-creator-score";
import type { InferredCreatorProfile } from "@/lib/creator-guidance/infer-creator-profile";
import { computeCreatorScore } from "@/lib/creator-guidance/compute-creator-score";
import { inferCreatorProfile } from "@/lib/creator-guidance/infer-creator-profile";
import { loadCreatorMemory } from "@/lib/creator-guidance/creator-memory-store";
import monManifest from "../../../generated/v190-monetization-manifest.json";
import contentMap from "../../../generated/v190-content-direction-map.json";

export type MonetizationReadiness = "low" | "medium" | "high";

export type LikelyCreatorTypeId =
  | "hobbyist_explorer"
  | "growth_focused_creator"
  | "commerce_creator"
  | "personal_brand_builder"
  | "lead_gen_operator";

export type MonetizationModeId =
  | "affiliate"
  | "product_selling"
  | "personal_brand"
  | "lead_generation"
  | "ad_driven_growth";

export type MonetizationFocus = "growth" | "balanced" | "revenue";

export type ContentTypeId =
  | "tutorial"
  | "storytelling"
  | "selling"
  | "opinion"
  | "personal_brand"
  | "list_tips"
  | "before_after";

export type MonetizationProfileV190 = {
  likely_creator_type_id: LikelyCreatorTypeId;
  likely_creator_type: string;
  likely_primary_goal: InferredCreatorProfile["primary_goal"];
  monetization_readiness: MonetizationReadiness;
  best_fit_monetization_mode: MonetizationModeId;
  best_fit_monetization_mode_label: string;
  current_focus: MonetizationFocus;
  current_focus_detail: string;
  recommended_content_types: { id: ContentTypeId; label: string; score: number }[];
  headlines: {
    best_goal_line: string;
    growth_vs_revenue_line: string;
    next_content_type_line: string;
    recommended_action: string;
  };
};

function intentLower(m: CreatorMemoryV187): string {
  return (m.last_v186_intent_id ?? "").toLowerCase();
}

function publishCount(m: CreatorMemoryV187): number {
  return m.publish_events.filter((e) => e.type === "upload_redirect").length;
}

function labelForMode(id: MonetizationModeId): string {
  const row = (monManifest.monetization_modes as { id: string; label: string }[]).find((x) => x.id === id);
  return row?.label ?? id;
}

function labelForCreatorType(id: LikelyCreatorTypeId): string {
  const row = (monManifest.creator_types as { id: string; label: string }[]).find((x) => x.id === id);
  return row?.label ?? id;
}

function scoreCreatorType(
  memory: CreatorMemoryV187,
  score: CreatorScoreResult,
  profile: InferredCreatorProfile
): LikelyCreatorTypeId {
  const gens = memory.generation_history.length;
  const tools = new Set(memory.generation_history.map((g) => g.tool_slug));
  const i = intentLower(memory);
  const pub = publishCount(memory);

  const s: Record<LikelyCreatorTypeId, number> = {
    hobbyist_explorer: 0,
    growth_focused_creator: 0,
    commerce_creator: 0,
    personal_brand_builder: 0,
    lead_gen_operator: 0
  };

  if (gens < 6 && tools.size <= 2 && pub === 0) s.hobbyist_explorer += 5;
  if (
    (profile.primary_goal === "followers" || profile.primary_goal === "views") &&
    (tools.has("title-generator") || tools.has("hashtag-generator")) &&
    score.workflowCompletionPercent >= 35
  ) {
    s.growth_focused_creator += 5;
  }
  if (
    profile.primary_goal === "sales" ||
    i.includes("shop") ||
    i.includes("promote") ||
    memory.niche_hints.some((n) => /shop|sell|product|affiliate/i.test(n))
  ) {
    s.commerce_creator += 5;
    if (profile.dominant_style === "selling") s.commerce_creator += 2;
  }
  if (i.includes("story") || profile.dominant_style === "storytelling") {
    s.personal_brand_builder += 3;
  }
  if (score.metrics.distinctUsageDays >= 3 && memory.niche_hints.length >= 4) {
    s.personal_brand_builder += 3;
  }
  if (memory.niche_hints.some((n) => /book|call|dm|client|service|coach|consult/i.test(n))) {
    s.lead_gen_operator += 4;
  }
  if (tools.has("tiktok-caption-generator") && memory.copy_events.length >= 3) {
    s.lead_gen_operator += 1;
  }

  let best: LikelyCreatorTypeId = "hobbyist_explorer";
  let bestScore = -1;
  (Object.keys(s) as LikelyCreatorTypeId[]).forEach((k) => {
    if (s[k] > bestScore) {
      bestScore = s[k];
      best = k;
    }
  });
  return bestScore > 0 ? best : "hobbyist_explorer";
}

function readinessFromSignals(
  score: CreatorScoreResult,
  memory: CreatorMemoryV187,
  profile: InferredCreatorProfile
): MonetizationReadiness {
  const pub = publishCount(memory);
  const i = intentLower(memory);
  const sales = profile.primary_goal === "sales" || i.includes("shop") || i.includes("promote");

  if (score.band === "advanced" || (sales && pub >= 1) || score.workflowCompletionPercent > 70) {
    return "high";
  }
  if (
    score.band === "active" ||
    (score.workflowCompletionPercent >= 40 && score.workflowCompletionPercent <= 75) ||
    pub >= 1
  ) {
    return "medium";
  }
  if (score.band === "beginner" || score.band === "rising" || score.workflowCompletionPercent < 40 || memory.generation_history.length < 6) {
    return "low";
  }
  return "medium";
}

function pickMonetizationMode(
  creatorType: LikelyCreatorTypeId,
  readiness: MonetizationReadiness,
  profile: InferredCreatorProfile,
  score: CreatorScoreResult,
  memory: CreatorMemoryV187
): MonetizationModeId {
  const i = intentLower(memory);
  const gens = memory.generation_history.length;

  if (readiness === "high" && (profile.primary_goal === "sales" || i.includes("shop") || creatorType === "commerce_creator")) {
    return "product_selling";
  }
  if (creatorType === "personal_brand_builder" || i.includes("story")) {
    return "personal_brand";
  }
  if (creatorType === "lead_gen_operator") {
    return "lead_generation";
  }
  if (
    (score.band === "advanced" || score.score >= 68) &&
    gens >= 15 &&
    (profile.primary_goal === "views" || profile.primary_goal === "followers")
  ) {
    return "ad_driven_growth";
  }
  if (profile.primary_goal === "followers" || (memory.tool_usage_history.filter((t) => t.tool_slug.includes("hashtag")).length >= 2)) {
    return "affiliate";
  }
  if (profile.primary_goal === "sales") return "product_selling";
  return "personal_brand";
}

function focusFromBandAndReadiness(
  score: CreatorScoreResult,
  readiness: MonetizationReadiness,
  profile: InferredCreatorProfile,
  mode: MonetizationModeId
): { focus: MonetizationFocus; detail: string } {
  if (score.band === "beginner" || score.band === "rising" || readiness === "low") {
    return {
      focus: "growth",
      detail: "grow reach and posting consistency before optimizing conversion"
    };
  }
  if (score.band === "active" && readiness === "medium") {
    return {
      focus: "balanced",
      detail: "split effort between discovery (hooks/titles) and one clear CTA per post"
    };
  }
  if (
    score.band === "advanced" ||
    readiness === "high" ||
    mode === "product_selling" ||
    profile.primary_goal === "sales"
  ) {
    return {
      focus: "revenue",
      detail: "lean into proof, offers, and repeatable conversion beats"
    };
  }
  return { focus: "balanced", detail: "alternate growth posts with one conversion-focused post per few uploads" };
}

function scoreContentTypes(
  memory: CreatorMemoryV187,
  score: CreatorScoreResult,
  profile: InferredCreatorProfile,
  readiness: MonetizationReadiness,
  creatorTypeId: LikelyCreatorTypeId
): { id: ContentTypeId; label: string; score: number }[] {
  const i = intentLower(memory);
  const types = contentMap.content_types as unknown as {
    id: ContentTypeId;
    label: string;
    weights: Record<string, number>;
  }[];
  const rules = contentMap.stage_aware_rules as {
    bands: string[];
    boost_types: string[];
    penalize_types: string[];
    penalty: number;
  }[];

  const has = (sub: string) => i.includes(sub);

  const out = types.map((t) => {
    let sc = 0;
    const w = t.weights;
    if (w.intent_tutorial && has("tutorial")) sc += w.intent_tutorial;
    if (w.intent_story && has("story")) sc += w.intent_story;
    if (w.intent_sales && (has("shop") || has("promote") || has("sell"))) sc += w.intent_sales;
    if (w.intent_views_viral && (has("view") || has("viral"))) sc += w.intent_views_viral;
    if (w.intent_promote_product && (has("promote") || has("product"))) sc += w.intent_promote_product;
    if (w.dominant_educational && profile.dominant_style === "educational") sc += w.dominant_educational;
    if (w.dominant_storytelling && profile.dominant_style === "storytelling") sc += w.dominant_storytelling;
    if (w.dominant_selling && profile.dominant_style === "selling") sc += w.dominant_selling;
    if (w.primary_followers && profile.primary_goal === "followers") sc += w.primary_followers;
    if (w.primary_views && profile.primary_goal === "views") sc += w.primary_views;
    if (w.tool_caption_usage && memory.generation_history.some((g) => g.tool_slug.includes("caption"))) sc += w.tool_caption_usage;
    if (w.title_heavy && memory.generation_history.some((g) => g.tool_slug === "title-generator")) sc += w.title_heavy;
    if (w.hook_heavy && memory.generation_history.some((g) => g.tool_slug === "hook-generator")) sc += w.hook_heavy;
    if (w.hashtag_heavy && memory.generation_history.some((g) => g.tool_slug === "hashtag-generator")) sc += w.hashtag_heavy;
    if (w.caption_heavy && memory.copy_events.filter((c) => c.result_type === "caption").length >= 2) sc += w.caption_heavy;
    if (w.stage_lte_3 && score.stage.id <= 3) sc += w.stage_lte_3;
    if (w.stage_gte_3 && score.stage.id >= 3) sc += w.stage_gte_3;
    if (w.repeat_days_gte_4 && score.metrics.distinctUsageDays >= 4) sc += w.repeat_days_gte_4;
    if (w.niche_hints_gte_5 && memory.niche_hints.length >= 5) sc += w.niche_hints_gte_5;
    if (w.readiness_high && readiness === "high") sc += w.readiness_high;
    if (w.readiness_medium_plus && readiness !== "low") sc += w.readiness_medium_plus;
    if (w.band_active_advanced && (score.band === "active" || score.band === "advanced")) sc += w.band_active_advanced;
    if (w.workflow_mid && score.workflowCompletionPercent >= 35 && score.workflowCompletionPercent <= 70) sc += w.workflow_mid;
    if (w.commerce_creator && creatorTypeId === "commerce_creator") sc += w.commerce_creator;

    for (const r of rules) {
      if (!r.bands.includes(score.band)) continue;
      if (r.boost_types.includes(t.id)) sc += 2;
      if (r.penalize_types.includes(t.id)) sc -= r.penalty;
    }

    return { id: t.id, label: t.label, score: sc };
  });

  return out.sort((a, b) => b.score - a.score);
}

function recommendedAction(
  mode: MonetizationModeId,
  focus: MonetizationFocus,
  score: CreatorScoreResult,
  toolSlug: string
): string {
  if (focus === "growth") {
    return "Post 3 short tutorials or list-style videos this week; keep one consistent niche keyword in every hook.";
  }
  if (mode === "affiliate") {
    return "Add one honest “why I use this” proof beat before any product mention in captions.";
  }
  if (mode === "product_selling") {
    return "Run one offer post with a single CTA (comment / link / DM) — remove extra asks.";
  }
  if (mode === "lead_generation") {
    return "End with one low-friction CTA (save / comment / DM) that matches your service.";
  }
  if (toolSlug.includes("hook")) {
    return "Draft 2 hook variants: curiosity vs proof — pick the winner after one day’s data.";
  }
  return "Batch titles + hooks for the same topic; publish the strongest pair first.";
}

export function inferMonetizationProfile(
  memory: CreatorMemoryV187,
  profile: InferredCreatorProfile,
  score: CreatorScoreResult,
  toolSlug: string
): MonetizationProfileV190 {
  const creatorId = scoreCreatorType(memory, score, profile);
  const creatorLabel = labelForCreatorType(creatorId);
  const readiness = readinessFromSignals(score, memory, profile);
  const mode = pickMonetizationMode(creatorId, readiness, profile, score, memory);
  const modeLabel = labelForMode(mode);
  const { focus, detail } = focusFromBandAndReadiness(score, readiness, profile, mode);
  const ranked = scoreContentTypes(memory, score, profile, readiness, creatorId);
  const topTypes = ranked.filter((x) => x.score > 0).slice(0, 3);
  const displayTypes = topTypes.length ? topTypes : ranked.slice(0, 2);

  const templates = monManifest.copy_templates as Record<string, string>;
  const typePhrase = displayTypes.map((x) => x.label).join(" · ");

  const headlines = {
    best_goal_line: templates.goal_line
      .replace("{mode}", modeLabel)
      .replace("{creator_type}", creatorLabel),
    growth_vs_revenue_line: templates.growth_vs_revenue
      .replace("{focus}", focus === "growth" ? "Growth" : focus === "revenue" ? "Conversion" : "Balanced")
      .replace("{focus_detail}", detail),
    next_content_type_line: templates.next_content.replace("{content_types}", typePhrase || "tutorial · list tips"),
    recommended_action: templates.recommended_action.replace(
      "{action}",
      recommendedAction(mode, focus, score, toolSlug)
    )
  };

  return {
    likely_creator_type_id: creatorId,
    likely_creator_type: creatorLabel,
    likely_primary_goal: profile.primary_goal,
    monetization_readiness: readiness,
    best_fit_monetization_mode: mode,
    best_fit_monetization_mode_label: modeLabel,
    current_focus: focus,
    current_focus_detail: detail,
    recommended_content_types: displayTypes.map(({ id, label, score: sc }) => ({ id, label, score: sc })),
    headlines
  };
}

/** Convenience: full inference from current browser memory. */
export function getMonetizationProfileForTool(toolSlug: string): MonetizationProfileV190 {
  const memory = loadCreatorMemory();
  const profile = inferCreatorProfile(memory);
  const score = computeCreatorScore(memory, toolSlug);
  return inferMonetizationProfile(memory, profile, score, toolSlug);
}

/**
 * V190 — For future Knowledge Engine: bias retrieval/recipes toward monetization mode.
 * Call after user memory is loaded (same browser).
 */
export function getMonetizationModeForKnowledgeEngine(): MonetizationModeId {
  const memory = loadCreatorMemory();
  const profile = inferCreatorProfile(memory);
  const score = computeCreatorScore(memory, "tiktok-caption-generator");
  const creatorId = scoreCreatorType(memory, score, profile);
  const readiness = readinessFromSignals(score, memory, profile);
  return pickMonetizationMode(creatorId, readiness, profile, score, memory);
}
