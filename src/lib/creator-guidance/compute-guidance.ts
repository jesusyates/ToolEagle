/**
 * V187 — Guidance Engine: next-step + tips from memory + journey (behavior-based only).
 */

import journeySource from "@/config/creator-guidance/v187-journey.source.json";
import type { CreatorMemoryV187 } from "@/lib/creator-guidance/creator-memory-store";
import { inferCreatorProfile, type InferredCreatorProfile } from "@/lib/creator-guidance/infer-creator-profile";
import {
  computeCreatorScore,
  type CreatorScoreBand,
  type CreatorScoreResult
} from "@/lib/creator-guidance/compute-creator-score";
import { inferMonetizationProfile } from "@/lib/creator-guidance/infer-monetization-profile";
import { loadCreatorAnalysis } from "@/lib/creator-analysis/storage";

export type GuidancePack = {
  journey_step_id: number;
  journey_key: string;
  journey_title: string;
  headline: string;
  bullets: string[];
  next_cta?: { label: string; href: string };
  secondary_cta?: { label: string; href: string };
};

const TOOL_DEFAULT = journeySource.tool_default_step as Record<string, number>;
const LINKS = journeySource.workflow_links as Record<string, string>;

function lastToolSlug(memory: CreatorMemoryV187): string | null {
  const h = memory.tool_usage_history;
  if (!h.length) return null;
  return h[h.length - 1]?.tool_slug ?? null;
}

function usedTool(memory: CreatorMemoryV187, slug: string): boolean {
  return memory.tool_usage_history.some((x) => x.tool_slug === slug) || memory.generation_history.some((x) => x.tool_slug === slug);
}

export function resolveJourneyStepId(toolSlug: string, memory: CreatorMemoryV187): number {
  return TOOL_DEFAULT[toolSlug] ?? 3;
}

function stepMeta(id: number) {
  const steps = journeySource.journey_steps as { id: number; key: string; title: string; future?: boolean }[];
  return steps.find((s) => s.id === id) ?? steps[0]!;
}

function scoreToneBullets(band: CreatorScoreBand, score: CreatorScoreResult): string[] {
  const out: string[] = [];
  switch (band) {
    case "beginner":
      out.push(`Your stage: ${score.stage.title}. Next best move: ${score.nextBestActionLabel}`);
      out.push(`Workflow completion: ${score.workflowCompletionPercent}% — finish hook → caption → hashtag → title, then upload once.`);
      break;
    case "rising":
      out.push(`Stage: ${score.stage.title}. Keep chaining tools instead of restarting from scratch each time.`);
      out.push(`Score ${score.score}/100 — add one more distinct tool this week to unlock faster patterns.`);
      break;
    case "active":
      out.push(`Stage: ${score.stage.title}. Optimize what you already ship: vary intent chips, then compare copy-to-publish ratio.`);
      out.push(`You’re at ${score.workflowCompletionPercent}% workflow completion — close the loop on weak steps only.`);
      break;
    case "advanced":
      out.push(`Stage: ${score.stage.title}. Push growth levers: titles + hooks for CTR; captions for retention; proof for revenue.`);
      out.push(`Score ${score.score}/100 — reuse winning intents, test new scenarios instead of random topics.`);
      break;
    default:
      break;
  }
  return out;
}

function creatorAnalysisLayerBullets(): string[] {
  if (typeof window === "undefined") return [];
  const s = loadCreatorAnalysis();
  if (!s?.output) return [];
  const o = s.output;
  const strat = o.short_strategy || o.next_best_strategy;
  return [
    `Saved Creator Analysis: stage ${o.creator_stage ?? "unknown"} · ${o.primary_focus ?? "—"} · focus ${o.account_focus_score}/100 · readiness ${o.monetization_readiness}.`,
    `Analysis: ${strat.slice(0, 220)}${strat.length > 220 ? "…" : ""}`
  ];
}

function monetizationLayerBullets(
  score: CreatorScoreResult,
  mon: ReturnType<typeof inferMonetizationProfile>,
  profile: InferredCreatorProfile
): string[] {
  const b: string[] = [];
  b.push(mon.headlines.growth_vs_revenue_line);
  b.push(mon.headlines.next_content_type_line);
  const early = score.band === "beginner" || score.band === "rising";
  const late = score.band === "active" || score.band === "advanced";
  if (early) {
    b.push("Monetization: build traffic and repeatable formats first — avoid hard-selling before you have proof of retention.");
  }
  if (late && mon.monetization_readiness !== "low") {
    b.push(
      "Monetization: test one conversion element per post (CTA, offer line, or proof) while keeping discovery strong (hook/title)."
    );
  }
  if (mon.current_focus === "growth" && profile.primary_goal === "sales") {
    b.push(
      "Your signals lean sales — but growth mode is still on: keep one educational or story post between offer posts."
    );
  }
  return b;
}

export function computeGuidance(
  toolSlug: string,
  memory: CreatorMemoryV187,
  profile: InferredCreatorProfile,
  scoreResult?: CreatorScoreResult
): GuidancePack {
  const score = scoreResult ?? computeCreatorScore(memory, toolSlug);
  const mon = inferMonetizationProfile(memory, profile, score, toolSlug);
  const stepId = resolveJourneyStepId(toolSlug, memory);
  const step = stepMeta(stepId);
  const usedHook = usedTool(memory, "hook-generator");
  const usedCaption = usedTool(memory, "tiktok-caption-generator");
  const usedHashtag = usedTool(memory, "hashtag-generator");

  const bullets: string[] = [
    ...scoreToneBullets(score.band, score),
    ...creatorAnalysisLayerBullets(),
    ...monetizationLayerBullets(score, mon, profile)
  ];
  let headline = `${score.bandLabel} creator · Step ${stepId}: ${step.title}`;
  let next_cta: GuidancePack["next_cta"];
  let secondary_cta: GuidancePack["secondary_cta"];

  if (profile.creator_level === "beginner") {
    bullets.push("Pick one intent + scenario (Knowledge Engine) before generating — it steers the whole package.");
    bullets.push("Copy one block at a time (hook first) so your post stays coherent.");
  } else {
    bullets.push("Rotate hook strength labels across runs to A/B what your audience saves.");
    bullets.push("If watch time is flat, tighten the first line before adding more hashtags.");
  }

  const earlyBand = score.band === "beginner" || score.band === "rising";
  const allowHardSell = !earlyBand && (mon.monetization_readiness === "medium" || mon.monetization_readiness === "high");

  if (profile.primary_goal === "sales") {
    if (allowHardSell) {
      bullets.push("Lead with a clear promise + proof beat; put the offer in caption + CTA, not only hashtags.");
    } else {
      bullets.push(
        "Selling intent detected — still prioritize one valuable tutorial or story post for every offer post (trust before pitch)."
      );
    }
    if (!usedCaption && toolSlug === "hashtag-generator") {
      next_cta = { label: "Open Caption Generator", href: LINKS["tiktok-caption-generator"] ?? "/tools/tiktok-caption-generator" };
    }
  } else if (profile.primary_goal === "followers") {
    bullets.push("Titles + hashtags help discovery; pair them with a strong hook so new viewers stay.");
    if (!usedHook && (toolSlug === "title-generator" || toolSlug === "hashtag-generator")) {
      next_cta = { label: "Generate hooks next", href: LINKS["hook-generator"] ?? "/tools/hook-generator" };
    }
  } else {
    bullets.push("Optimize for retention: hook → one proof → one CTA; avoid stuffing too many ideas in one post.");
  }

  if (profile.dominant_style === "storytelling") {
    bullets.push("Story posts win on emotion in beat 1 — keep on-screen text short if the hook is verbal.");
  } else if (profile.dominant_style === "selling" && allowHardSell) {
    bullets.push("Disclose partnerships; avoid guaranteed-results language — keep claims assistive.");
  }

  if (profile.dominant_style === "selling" && !allowHardSell) {
    bullets.push("Keep sales language soft until you have consistent posting — lead with helpful specifics.");
  }

  if (toolSlug === "tiktok-caption-generator" && !usedHook) {
    headline = "Stronger captions start from a locked hook";
    bullets.unshift("You haven’t used the Hook Generator yet — try it once, then paste the winner back here.");
    next_cta = { label: "Open Hook Generator", href: LINKS["hook-generator"] ?? "/tools/hook-generator" };
  }

  if (toolSlug === "hook-generator" && usedHook && !usedCaption) {
    secondary_cta = { label: "Expand to full caption pack", href: LINKS["tiktok-caption-generator"] ?? "/tools/tiktok-caption-generator" };
  }

  if (toolSlug === "hashtag-generator" && usedHashtag && memory.copy_events.filter((c) => c.result_type === "hashtags").length > 3) {
    bullets.push("You copy hashtags often — test a new caption angle; hashtags amplify, they rarely fix a weak hook.");
  }

  return {
    journey_step_id: stepId,
    journey_key: step.key,
    journey_title: step.title,
    headline,
    bullets: bullets.slice(0, 10),
    next_cta,
    secondary_cta
  };
}

export function getGuidanceForTool(toolSlug: string, memory: CreatorMemoryV187): GuidancePack {
  const profile = inferCreatorProfile(memory);
  const score = computeCreatorScore(memory, toolSlug);
  return computeGuidance(toolSlug, memory, profile, score);
}
