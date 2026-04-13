import type { AppSeoSeedRecord } from "@/lib/seo-seed-registry";
import { pickConcreteLine } from "./scenario-concrete-phrases";

/** Ops-facing summary of rules bundled in this mapper pass. */
export const SCENARIO_MAPPER_RULES = {
  version: 2,
  normalization: [
    "Concrete search-shaped lines from scenario-concrete-phrases (keyword overlay + seed defaults).",
    "No stacked abstract domains (writing and content, learning and productivity, etc.).",
    "No weak audience tails (bloggers, marketers, small teams, solo founders, busy creators).",
    "Keyword patches prefer real tasks: captions, titles, emails, product descriptions, notes, automation."
  ],
  bannedPatterns: [
    "on global / for global creators (structural)",
    "ungrammatical using write stacks",
    "post-process abstract junk phrases (see quality gate)"
  ],
  qualityGate: [
    "Length and word count bounds",
    "Legacy regex bans",
    "Reject abstract domain stacks and weak audience suffixes",
    "Reject low-intent explainer markers",
    "Cap repeated long tokens and AI token count"
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
  /\bon worldwide\b/i
];

const ABSTRACT_JUNK = /\b(writing and content|content work|learning and productivity|for writing and content|plain-english explainer|practical overview|chat and research|prompting and instructions|personalized assistance|AI-assisted work|without adding headcount|smarter \w+ habits)\b/i;

const WEAK_AUDIENCE = /\bfor (bloggers|marketers|small teams|solo founders|busy creators|content creators)\b/i;

const LOW_INTENT_EXPLAINER = /\b(plain english|explainer for|what to know before you start)\b/i;

const WRITING_TOOL_STACK = /\bwriting tool\b.*\bwriting\b/i;

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

export function passesTopicQuality(topic: string): boolean {
  const t = topic.replace(/\s+/g, " ").trim();
  if (t.length < 22 || t.length > 130) return false;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length < 4) return false;
  if (!topicPassesHardFilters(t)) return false;
  if (aiTokenCount(t) > 4) return false;
  if (ABSTRACT_JUNK.test(t)) return false;
  if (WEAK_AUDIENCE.test(t)) return false;
  if (LOW_INTENT_EXPLAINER.test(t)) return false;
  if (WRITING_TOOL_STACK.test(t)) return false;

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
  if (!topicPassesHardFilters(topic) || !passesTopicQuality(topic)) {
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
  if (!topicPassesHardFilters(t) || !passesTopicQuality(t)) return null;
  return t;
}
