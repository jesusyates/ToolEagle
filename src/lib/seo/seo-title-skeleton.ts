/** Fixed English SEO title skeletons — no free-form template stacking. */

import type { SeoPreflightContentType } from "@/lib/seo-preflight/types/preflight";

export type SeoTitleSkeletonKind =
  | "howto"
  | "best"
  | "examples"
  | "vs"
  | "compared"
  | "howto_improve"
  | "best_creators"
  | "before_after";

const YEAR = 2026;

export function stableTitleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function cleanTopicPhrase(topic: string): string {
  return (topic || "")
    .replace(/\bplaybook\b/gi, "")
    .replace(/\bstrategy\b/gi, "")
    .replace(/\bwhat to prioritize first\b/gi, "")
    .replace(/\bi wish i had on day one\b/gi, "")
    .replace(/\bthat scales\b/gi, "")
    .replace(/\bgrow faster\b/gi, "")
    .replace(/\bexplained\b/gi, "")
    .replace(/\btips\b/gi, "")
    .replace(/\bmistakes\b/gi, "")
    .replace(/\bfor creators\b/gi, "")
    .replace(/\bstep-by-step guide\b/gi, "")
    .replace(/\bwhat actually works in \d{4}\b/gi, "")
    .replace(/\bhow to improve\b/gi, "")
    .replace(/\bhow to\b/gi, "")
    .replace(/\bbefore and after\b/gi, "")
    .replace(/\bin 2026\b/gi, "")
    .replace(/\bexamples?\b/gi, "")
    .replace(/\bcompared\b/gi, "")
    .replace(/\bbest\b/gi, "")
    .replace(/\bvs\b/gi, "")
    .replace(/\bfix\b/gi, "")
    .replace(/\bside by side\b/gi, "")
    .replace(/\bthat work well\b/gi, "that works well")
    .replace(/\s+/g, " ")
    .trim();
}

/** True if the raw topic still contains wording that the title skeleton will add again (stacking risk). */
export function hasDirtyTopicPhrase(topic: string): boolean {
  const t = (topic || "").toLowerCase();
  return (
    /\bbest\b/.test(t) ||
    /\bcompared\b/.test(t) ||
    /\bexamples?\b/.test(t) ||
    /\bfor creators\b/.test(t) ||
    /\bbefore and after\b/.test(t) ||
    /\bin 2026\b/.test(t) ||
    /\bhow to\b/.test(t) ||
    /\bvs\b/.test(t)
  );
}

/** Light grammar polish after skeleton rebuild — does not change skeleton selection. */
function polishFinalTitle(title: string): string {
  return title
    .replace(/How to improve Fix /gi, "How to improve ")
    .replace(/Side By Side$/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeRepeatedTitleTokens(title: string): string {
  return title
    .replace(/\bBest Best\b/gi, "Best")
    .replace(/\bcompared compared\b/gi, "compared")
    .replace(/\bexamples examples\b/gi, "examples")
    .replace(/\bHow to How to\b/gi, "How to")
    .replace(/\s+/g, " ")
    .trim();
}

function formatTopicWords(topic: string): string {
  const small = new Set(["and", "or", "for", "to", "in", "vs", "a", "an", "the", "of", "on"]);
  return topic
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      const lower = w.toLowerCase();
      if (small.has(lower)) return lower;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

export function buildSeoTitleFromSkeleton(input: {
  topic: string;
  type: SeoTitleSkeletonKind;
  altTopic?: string;
}): string {
  const topicRaw = cleanTopicPhrase(cleanTopicPhrase(input.topic));
  const altRaw = cleanTopicPhrase(cleanTopicPhrase(input.altTopic || ""));
  const topic = formatTopicWords(topicRaw || "Content");
  const alt = formatTopicWords(altRaw);

  let out: string;
  switch (input.type) {
    case "howto":
      out = `How to ${topic} in ${YEAR}`;
      break;
    case "best":
      out = `Best ${topic} in ${YEAR}`;
      break;
    case "examples":
      out = `${topic} examples in ${YEAR}`;
      break;
    case "vs":
      out = alt ? `${topic} vs ${alt}` : `Best ${topic} compared`;
      break;
    case "compared":
      out = `Best ${topic} compared`;
      break;
    case "howto_improve":
      out = `How to improve ${topic}`;
      break;
    case "best_creators":
      out = `Best ${topic} for creators`;
      break;
    case "before_after":
      out = `${topic} before and after`;
      break;
    default:
      out = `How to ${topic} in ${YEAR}`;
  }
  return dedupeRepeatedTitleTokens(out);
}

export const VALID_EN_TITLE_SKELETON_RES: RegExp[] = [
  /^How to .+ in 2026$/i,
  /^Best .+ in 2026$/i,
  /^.+ examples in 2026$/i,
  /^.+ vs .+$/i,
  /^Best .+ compared$/i,
  /^How to improve .+$/i,
  /^Best .+ for creators$/i,
  /^.+ before and after$/i
];

export function matchesValidEnglishTitleSkeleton(title: string): boolean {
  const t = title.trim();
  return VALID_EN_TITLE_SKELETON_RES.some((re) => re.test(t));
}

export function shouldEnforceEnglishTitleSkeleton(title: string): boolean {
  return !/[\u4e00-\u9fff\u3040-\u30ff]/.test(title);
}

export function rebuildEnglishTitleToSkeleton(title: string): string {
  const t = title.trim();
  const vsParts = t.split(/\s+vs\s+/i).map((x) => x.trim()).filter(Boolean);
  if (vsParts.length >= 2) {
    const a = cleanTopicPhrase(vsParts[0]!);
    const b = cleanTopicPhrase(vsParts.slice(1).join(" vs "));
    let built = buildSeoTitleFromSkeleton({
      topic: a || vsParts[0]!,
      type: "vs",
      altTopic: b || vsParts[1]!
    });
    built = polishFinalTitle(built);
    return built;
  }

  let core = t
    .replace(/^how to improve\s+/i, "")
    .replace(/^how to\s+/i, "")
    .replace(/^best\s+/i, "")
    .replace(/\s+in 2026$/i, "")
    .replace(/\s+examples\s+in 2026$/i, "")
    .replace(/\s+examples$/i, "")
    .replace(/\s+compared$/i, "")
    .replace(/\s+for creators$/i, "")
    .replace(/\s+before and after$/i, "")
    .replace(/\([^)]*\)/g, " ");

  core = cleanTopicPhrase(cleanTopicPhrase(core));
  if (!core) core = "content";

  const kinds: SeoTitleSkeletonKind[] = [
    "howto",
    "best",
    "examples",
    "compared",
    "howto_improve",
    "best_creators",
    "before_after"
  ];
  const kind = kinds[stableTitleHash(t) % kinds.length]!;
  let built = buildSeoTitleFromSkeleton({ topic: core, type: kind });
  built = polishFinalTitle(built);
  return built;
}

export function pickEnglishSkeletonKindForPreflight(
  contentType: SeoPreflightContentType,
  variationIndex: number,
  patternRetryOffset: number,
  seed: string
): SeoTitleSkeletonKind {
  const idx = variationIndex * 7 + stableTitleHash(seed) + patternRetryOffset * 23;
  switch (contentType) {
    case "how_to": {
      const pool: SeoTitleSkeletonKind[] = ["howto", "howto_improve"];
      return pool[Math.abs(idx) % pool.length]!;
    }
    case "comparison":
    case "comparison_from_experience":
      return "compared";
    case "listicle":
      return Math.abs(idx) % 2 === 0 ? "examples" : "best";
    case "mistakes":
      return Math.abs(idx) % 2 === 0 ? "howto_improve" : "best";
    case "problem_solution":
      return Math.abs(idx) % 2 === 0 ? "howto" : "howto_improve";
    case "myth_busting":
      return Math.abs(idx) % 2 === 0 ? "best" : "examples";
    case "pattern_breakdown":
      return Math.abs(idx) % 2 === 0 ? "howto" : "examples";
    case "scenario_specific":
      return Math.abs(idx) % 2 === 0 ? "best_creators" : "howto";
    case "guide":
    default: {
      const pool: SeoTitleSkeletonKind[] = [
        "howto",
        "best",
        "examples",
        "compared",
        "howto_improve",
        "best_creators",
        "before_after"
      ];
      return pool[Math.abs(idx) % pool.length]!;
    }
  }
}
