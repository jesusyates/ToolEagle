/**
 * V191 — Rank platform-native patterns by intent, scenario, monetization profile, and quality/revenue scores.
 */

import tiktokData from "@/config/platform-intelligence/tiktok-patterns.json";
import youtubeData from "@/config/platform-intelligence/youtube-patterns.json";
import instagramData from "@/config/platform-intelligence/instagram-patterns.json";
import monMap from "@/config/platform-intelligence/monetization-mapping.json";
import v193Patterns from "../../../generated/v193-platform-patterns.json";

export type PlatformId = "tiktok" | "youtube" | "instagram";

export type PlatformUserProfile = {
  monetizationMode?: string | null;
  primaryGoal?: "views" | "followers" | "sales" | null;
};

export type PlatformPatternRecord = {
  id: string;
  platform: PlatformId;
  pattern_type: string;
  tool_type: string;
  structure: string;
  intent_fit: string[];
  scenario_fit: string[];
  monetization_fit: string[];
  quality_score: number;
  revenue_score: number;
};

export type RankedPlatformPattern = {
  pattern: PlatformPatternRecord;
  score: number;
};

const BASE_PATTERNS: PlatformPatternRecord[] = [
  ...(tiktokData as { patterns: PlatformPatternRecord[] }).patterns,
  ...(youtubeData as { patterns: PlatformPatternRecord[] }).patterns,
  ...(instagramData as { patterns: PlatformPatternRecord[] }).patterns
];

const V193_PATTERNS: PlatformPatternRecord[] = [
  ...(Array.isArray((v193Patterns as any)?.patterns)
    ? (v193Patterns as any).patterns
    : Array.isArray(v193Patterns)
      ? (v193Patterns as any)
      : [])
];

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function intentOverlapScore(intentId: string, fits: string[]): number {
  const i = intentId.toLowerCase();
  let best = 0;
  for (const f of fits) {
    const fl = f.toLowerCase();
    const stripped = fl.replace(/^intent_/, "");
    if (i === fl || i.includes(stripped) || fl.includes(i.replace(/^intent_/, ""))) {
      best = Math.max(best, 1);
    } else if (i.includes(fl.split("_")[1] ?? "") || stripped.length > 3) {
      if (i.includes(stripped.slice(0, 4))) best = Math.max(best, 0.45);
    }
  }
  return best;
}

function scenarioOverlapScore(scenarioId: string, fits: string[]): number {
  const s = scenarioId.toLowerCase();
  let best = 0;
  for (const f of fits) {
    const fl = f.toLowerCase();
    if (s === fl || s.includes(fl.replace(/^sc_/, "")) || fl.includes(s.replace(/^sc_/, ""))) {
      best = Math.max(best, 1);
    }
  }
  return best;
}

function monetizationOverlap(mode: string | null | undefined, fits: string[]): number {
  if (!mode) return 0.35;
  const m = mode.toLowerCase();
  for (const f of fits) {
    if (m.includes(f.toLowerCase()) || f.toLowerCase().includes(m)) return 1;
  }
  return 0.25;
}

function primaryGoalMultipliers(goal: PlatformUserProfile["primaryGoal"]): { q: number; r: number } {
  const g = goal ?? "views";
  const bias = (monMap.primary_goal_bias as Record<string, { revenue_score_multiplier?: number; quality_score_multiplier?: number }>)[g];
  return {
    q: bias?.quality_score_multiplier ?? 1,
    r: bias?.revenue_score_multiplier ?? 1
  };
}

function modeBoostWeight(mode: string | null | undefined): number {
  if (!mode) return 0;
  const m = mode.toLowerCase();
  const boosts = monMap.mode_boost as Record<string, { fit_overlap_weight?: number }>;
  for (const [k, v] of Object.entries(boosts)) {
    if (m.includes(k) || k.includes(m)) return v.fit_overlap_weight ?? 0;
  }
  return 0;
}

/**
 * Rank patterns for a single platform + tool row (hook_focus, tiktok_caption, hashtag, title).
 * No user text required — works with defaults (V188 promptless).
 */
export function resolvePlatformPatterns(input: {
  platform: PlatformId;
  intentId: string;
  scenarioId: string;
  userProfile?: PlatformUserProfile;
  toolType: string;
  limit?: number;
  /** V193 verification: disable V193 observation-derived patterns when true */
  disableV193?: boolean;
}): RankedPlatformPattern[] {
  const { platform, intentId, scenarioId, toolType, userProfile } = input;
  const limit = input.limit ?? 4;
  const mode = userProfile?.monetizationMode ?? null;
  const goal = userProfile?.primaryGoal ?? null;
  const { q: qMul, r: rMul } = primaryGoalMultipliers(goal);
  const modeW = modeBoostWeight(mode);
  const pool = input.disableV193 ? BASE_PATTERNS : BASE_PATTERNS.concat(V193_PATTERNS);

  const candidates = pool.filter((p) => {
    if (p.platform !== platform) return false;
    if (p.tool_type !== toolType && p.tool_type !== "all") return false;
    return true;
  });

  const ranked = candidates
    .map((pattern) => {
      const intentS = intentOverlapScore(intentId, pattern.intent_fit);
      const scenS = scenarioOverlapScore(scenarioId, pattern.scenario_fit);
      const monS = monetizationOverlap(mode, pattern.monetization_fit);

      let sc =
        pattern.quality_score * qMul * 0.42 +
        pattern.revenue_score * rMul * 0.38 +
        intentS * 0.12 +
        scenS * 0.08 +
        monS * (0.06 + modeW);

      return { pattern, score: sc };
    })
    .sort((a, b) => b.score - a.score);

  return ranked.slice(0, limit);
}

export function inferPlatformFromToolSlug(toolSlug: string): PlatformId {
  const s = toolSlug.toLowerCase();
  if (s.includes("youtube") || s.includes("shorts")) return "youtube";
  if (s.includes("instagram") || s.includes("reel")) return "instagram";
  return "tiktok";
}
