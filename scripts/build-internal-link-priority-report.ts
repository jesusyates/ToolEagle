#!/usr/bin/env npx tsx
/**
 * V171 — Conversion / workflow-weighted related targets per tool → generated/internal-link-priority-report.json
 */

import fs from "fs";
import path from "path";
import { tools, toolsForEnglishSite } from "../src/config/tools";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "generated", "internal-link-priority-report.json");
const V181_LINK = path.join(ROOT, "generated", "v181-revenue-link-priority.json");

function readJson<T>(p: string): T | null {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8")) as T;
  } catch {
    return null;
  }
}

type ToolT = (typeof tools)[number];

function platformHint(slug: string): "tiktok" | "youtube" | "instagram" | "cross" {
  const s = slug.toLowerCase();
  if (s.includes("youtube") || s.includes("shorts-title")) return "youtube";
  if (s.includes("instagram") || s.includes("reel")) return "instagram";
  if (s.includes("tiktok") || s === "hook-generator" || s === "hashtag-generator" || s === "title-generator")
    return "tiktok";
  return "cross";
}

/** Same monetization path: core generators first. */
const HIGH_INTENT = new Set([
  "tiktok-caption-generator",
  "hook-generator",
  "hashtag-generator",
  "youtube-title-generator",
  "instagram-caption-generator",
  "ai-caption-generator"
]);

const WORKFLOW_NEXT: Record<string, string[]> = {
  "hook-generator": ["tiktok-caption-generator", "hashtag-generator", "ai-caption-generator"],
  "tiktok-caption-generator": ["hashtag-generator", "hook-generator", "youtube-title-generator"],
  "hashtag-generator": ["tiktok-caption-generator", "hook-generator"],
  "youtube-title-generator": ["youtube-description-generator", "youtube-tag-generator", "viral-hook-generator"],
  "instagram-caption-generator": ["instagram-hashtag-generator", "reel-caption-generator", "hook-generator"],
  "ai-caption-generator": ["hook-generator", "tiktok-caption-generator", "hashtag-generator"]
};

function scorePair(
  from: ToolT,
  to: ToolT,
  v181Boost: Record<string, number> | undefined,
  v181Pen: Record<string, number> | undefined
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  const pf = platformHint(from.slug);
  const pt = platformHint(to.slug);
  if (pf !== "cross" && pf === pt) {
    score += 3;
    reasons.push("same_platform_cluster");
  }
  if (from.category === to.category) {
    score += 2;
    reasons.push("same_workflow_category");
  }
  const chain = WORKFLOW_NEXT[from.slug];
  if (chain?.includes(to.slug)) {
    score += 2.5;
    reasons.push("workflow_next_step");
  }
  if (HIGH_INTENT.has(to.slug)) {
    score += 1.2;
    reasons.push("high_intent_tool");
  }
  if (to.isPopular) {
    score += 0.5;
    reasons.push("popular_surface");
  }
  const b = v181Boost?.[to.slug];
  const p = v181Pen?.[to.slug];
  if (b != null && Number.isFinite(b) && b > 1) {
    score *= b;
    reasons.push("v181_revenue_boost_target");
  }
  if (p != null && Number.isFinite(p) && p < 1) {
    score *= p;
    reasons.push("v181_revenue_penalty_target");
  }
  return { score, reasons };
}

type V181LinkDoc = {
  linkScoreBoostByToolSlug?: Record<string, number>;
  linkScorePenaltyByToolSlug?: Record<string, number>;
};

function main() {
  const v181 = readJson<V181LinkDoc>(V181_LINK);
  const boostMap = v181?.linkScoreBoostByToolSlug;
  const penMap = v181?.linkScorePenaltyByToolSlug;

  const en = toolsForEnglishSite.filter((t) => !t.cnOnly);
  const byToolSlug: Record<
    string,
    Array<{ href: string; targetSlug: string; score: number; reasons: string[] }>
  > = {};

  for (const from of en) {
    const ranked = en
      .filter((t) => t.slug !== from.slug)
      .map((to) => {
        const { score, reasons } = scorePair(from, to, boostMap, penMap);
        return {
          href: `/tools/${to.slug}`,
          targetSlug: to.slug,
          score,
          reasons
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 14);

    byToolSlug[from.slug] = ranked;
  }

  const doc = {
    version: "171.1",
    generatedAt: new Date().toISOString(),
    note:
      "Higher score = preferred internal link target for conversion-first navigation (platform → workflow → monetization path). V181 boost/penalty merged here for tool→tool ranking. EN programmatic blogs use scripts/lib/en-internal-linking.js (same v181 JSON + v176) for Related pages / backlinks / Related tools — see generated/v181-final-link-control.json.",
    byToolSlug
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(doc, null, 2), "utf8");
  console.log("[build-internal-link-priority-report]", OUT);
}

main();
