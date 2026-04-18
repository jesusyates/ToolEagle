import type { AppSeoSeedRecord } from "@/lib/seo-seed-registry";
import { pickConcreteLine } from "./scenario-concrete-phrases";

/** Ops-facing summary of rules bundled in this mapper pass. */
export const SCENARIO_MAPPER_RULES = {
  version: 3,
  normalization: [
    "Templates use {{keyword}} so every topic anchors to the seed keyword phrase.",
    "Search-intent shapes: how to X with AI, best X for Y, X vs Y, alternatives to X, examples, templates, tools.",
    "No generic creator-audience fluff (how creators use…, tips for… without a concrete task)."
  ],
  bannedPatterns: [
    "Weak explainer / audience-only phrasing (see regex + meaningful-word gate)",
    "Topics that do not overlap the seed keyword tokens",
    "Less than six total words or fewer than five meaningful tokens"
  ],
  qualityGate: [
    "Keyword anchor: full phrase or ≥2 significant tokens from keyword in topic",
    "Meaningful token count ≥5 (stopwords excluded)",
    "Length bounds; AI token cap; duplicate token rules unchanged"
  ]
} as const;

const BANNED_TOPIC_REGEXES: RegExp[] = [
  /\bon global\b/i,
  /\bfor global creators\b/i,
  /\bwith global creators\b/i,
  /\bhow to AI\b/i,
  /\bhow to ai\s+[a-z]+\s+(tool|generator|assistant)\b/i,
  /\busing write article\b/i,
  /\busing write caption\b/i,
  /\busing write\b/i,
  /\busing summarize content\b/i,
  /\busing generate ideas\b/i,
  /\busing edit writing\b/i,
  /\busing automate\b/i,
  /\bon worldwide\b/i,
  /\bhow creators\b/i,
  /\bcreators use\b/i,
  /\btips for\b/i,
  /\bfor creators\b/i,
  /\bAI assistants explained\b/i,
  /\bgeneric creator\b/i];

const ABSTRACT_JUNK = /\b(writing and content|content work|learning and productivity|for writing and content|plain-english explainer|practical overview|chat and research|prompting and instructions|personalized assistance|AI-assisted work|without adding headcount|smarter \w+ habits)\b/i;

const WEAK_AUDIENCE = /\bfor (bloggers|marketers|small teams|solo founders|busy creators|content creators)\b/i;

const LOW_INTENT_EXPLAINER = /\b(plain english|explainer for|what to know before you start)\b/i;

const WRITING_TOOL_STACK = /\bwriting tool\b.*\bwriting\b/i;

const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "for",
  "to",
  "of",
  "and",
  "or",
  "in",
  "on",
  "with",
  "at",
  "by",
  "as",
  "is",
  "are",
  "was",
  "were",
  "that",
  "this",
  "your",
  "you",
  "how",
  "what",
  "when",
  "why",
  "who",
  "it",
  "if",
  "than",
  "then",
  "from",
  "into",
  "vs",
  "without"
]);

function meaningfulTokenCount(topic: string): number {
  return topic.split(/\s+/).filter((w) => {
    const x = w.toLowerCase().replace(/[^a-z0-9]/g, "");
    return x.length > 2 && !STOPWORDS.has(x);
  }).length;
}

/** Require topic to reflect the seed keyword (phrase or multi-token overlap). */
export function topicHasKeywordAnchor(topic: string, keyword: string): boolean {
  const t = topic.toLowerCase();
  const kw = keyword.toLowerCase().replace(/\s+/g, " ").trim();
  if (!kw) return false;
  if (t.includes(kw)) return true;
  const parts = kw
    .split(/\s+/)
    .map((p) => p.replace(/[^a-z0-9]/g, ""))
    .filter((p) => p.length >= 3);
  if (parts.length === 0) return false;
  let hit = 0;
  for (const p of parts) {
    if (t.includes(p)) hit++;
  }
  return hit >= (parts.length >= 2 ? 2 : 1);
}

export function isGlobalPlatform(platform: string): boolean {
  const p = platform.trim().toLowerCase();
  return p === "global" || p === "all" || p === "worldwide" || p === "any";
}

function stableHash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  return Math.abs(h);
}

function aiTokenCount(t: string): number {
  return (t.toLowerCase().match(/\bai\b/g) ?? []).length;
}

export function topicPassesHardFilters(topic: string): boolean {
  const t = topic.replace(/\s+/g, " ").trim();
  return !BANNED_TOPIC_REGEXES.some((r) => r.test(t));
}

export type TopicQualityOpts = {
  /** Seed keyword phrase — required for natural scenario topics. */
  keyword?: string;
  /** Selling-point rows: shorter min length, skip strict keyword gate if false? we still anchor to `sp` text */
  sellingPoint?: boolean;
};

export function passesTopicQuality(topic: string, opts?: TopicQualityOpts): boolean {
  const t = topic.replace(/\s+/g, " ").trim();
  const selling = opts?.sellingPoint === true;
  const kw = opts?.keyword?.replace(/\s+/g, " ").trim() ?? "";
  const words = t.split(/\s+/).filter(Boolean);

  if (!selling) {
    if (t.length < 28 || t.length > 130) return false;
    if (words.length < 6) return false;
    if (meaningfulTokenCount(t) < 5) return false;
    if (kw && !topicHasKeywordAnchor(t, kw)) return false;
  } else {
    if (t.length < 14 || t.length > 130) return false;
    if (words.length < 4) return false;
    if (meaningfulTokenCount(t) < 3) return false;
    if (kw && !topicHasKeywordAnchor(t, kw)) return false;
  }

  if (!topicPassesHardFilters(t)) return false;
  if (aiTokenCount(t) > 4) return false;
  if (ABSTRACT_JUNK.test(t)) return false;
  if (WEAK_AUDIENCE.test(t)) return false;
  if (LOW_INTENT_EXPLAINER.test(t)) return false;
  if (WRITING_TOOL_STACK.test(t)) return false;

  if (/\bexplained\b/i.test(t)) {
    if (!kw || !topicHasKeywordAnchor(t, kw)) return false;
  }

  for (let i = 1; i < words.length; i++) {
    const a = words[i]!.toLowerCase().replace(/[^a-z0-9]/g, "");
    const b = words[i - 1]!.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (a.length > 2 && a === b) return false;
  }

  const counts = new Map<string, number>();
  for (const w of words) {
    const k = w.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (k.length < 4) continue;
    counts.set(k, (counts.get(k) ?? 0) + 1);
    if ((counts.get(k) ?? 0) > 2) return false;
  }

  return true;
}

export function postProcessTopic(topic: string, platform: string): string {
  let t = topic.replace(/\s+/g, " ").trim();
  if (isGlobalPlatform(platform)) {
    t = t.replace(/\bon global\b/gi, "").replace(/\bfor global creators\b/gi, "");
    t = t.replace(/\s+/g, " ").replace(/^\s*,\s*/, "").trim();
  }
  return t.replace(/\s+,/g, ",").replace(/\s+/g, " ").trim();
}

export function buildNaturalScenarioTopic(angle: string, seed: AppSeoSeedRecord, keyword: string): string | null {
  const kw = keyword.replace(/\s+/g, " ").trim();
  if (!kw) return null;
  const h = stableHash(seed.id + kw + angle);
  let topic = pickConcreteLine(angle, seed.id, kw, h);
  if (!topic) return null;

  topic = postProcessTopic(topic, seed.platform);
  if (!topicPassesHardFilters(topic) || !passesTopicQuality(topic, { keyword: kw })) {
    return null;
  }
  return topic;
}

export function buildSellingPointTopic(seed: AppSeoSeedRecord, sp: string): string | null {
  const s = sp.trim();
  if (!s) return null;
  const line = isGlobalPlatform(seed.platform)
    ? `${seed.feature}: ${s}`
    : `${seed.feature} on ${seed.platform}: ${s}`;
  const t = postProcessTopic(line, seed.platform);
  if (!topicPassesHardFilters(t) || !passesTopicQuality(t, { keyword: s, sellingPoint: true })) return null;
  return t;
}
