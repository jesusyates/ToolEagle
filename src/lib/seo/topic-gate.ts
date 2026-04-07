import { enContentTokenJaccard, normalizeEnTitleForDedup } from "./title-dedup-tokens";

export type TopicReadinessInput = {
  topic: string;
  existingTitles?: string[];
};

export type TopicReadinessResult = {
  decision: "pass" | "rewrite" | "reject";
  reasons: string[];
  score: number;
  contentType?: "guide" | "ideas";
};

const INTENT_RE = /\b(how|ideas|tips|guide|captions|hooks?|ways|strategy)\b/i;
/** Content-token Jaccard (stopwords stripped); slightly higher bar vs raw token overlap. */
const SIM_REJECT = 0.95;
/** Below reject; at/above this is rewrite — keep below SIM_REJECT so borderline topics still pass main chain. */
const SIM_REWRITE = 0.93;
const PRE_DEDUP_DROP_SIM_REJECT_EN = 0.95;

function maxTitleSimilarity(title: string, existingTitles: string[]): number {
  let max = 0;
  for (const t of existingTitles) {
    const s = String(t ?? "").trim();
    if (!s) continue;
    max = Math.max(max, enContentTokenJaccard(title, s));
  }
  return max;
}

/** True when normalized titles match or content-token Jaccard meets strict threshold (default topic-gate bar). */
function isStrictDuplicateTopic(candidate: string, existing: string, strictJaccard = 0.98): boolean {
  const a = normalizeEnTitleForDedup(candidate);
  const b = normalizeEnTitleForDedup(existing);
  if (a.length > 0 && a === b) return true;
  return enContentTokenJaccard(candidate, existing) >= strictJaccard;
}

/** Max Jaccard vs corpus — for pre-dedup before expensive model calls (same token rules as topic gate). */
export function topicMaxJaccardAgainstCorpus(topic: string, corpus: string[]): number {
  return maxTitleSimilarity(topic, corpus);
}

export type PreDropBeforeModelResult = {
  drop: boolean;
  reason?: string;
  /** TASK19: would have been hard pre_dedup drop; EN only — soft-pass to topic/publish/final gates. */
  preDedupSoftpassNote?: string;
};

/** Drop before rebuild only when high content overlap with a strict duplicate (not shared shell words alone). */
export function shouldPreDropTopicBeforeModel(
  topic: string,
  corpus: string[]
): PreDropBeforeModelResult {
  /** Slightly looser than topic-gate strict dup (0.98): fewer false pre-drops; publish_gate still filters. */
  const preDedupStrictJaccard = 0.99;
  for (const t of corpus) {
    const s = String(t ?? "").trim();
    if (!s) continue;
    const j = enContentTokenJaccard(topic, s);
    if (j < PRE_DEDUP_DROP_SIM_REJECT_EN) continue;
    if (isStrictDuplicateTopic(topic, s, preDedupStrictJaccard)) {
      return {
        drop: false,
        preDedupSoftpassNote: "title_duplicate:content_jaccard",
      };
    }
  }
  return { drop: false };
}

function inferContentType(topic: string): "guide" | "ideas" | undefined {
  const low = topic.toLowerCase();
  const ideasPhrase =
    /\b(post ideas|content ideas|caption ideas|hook ideas)\b/.test(low) ||
    /\bideas for\b|\bhooks for\b|\bcaptions for\b/i.test(low);
  if (ideasPhrase) return "ideas";
  if (/\bhow\b/.test(low)) return "guide";
  if (/\bbeginner guide\b|best ways\b|how to grow\b|\bguide to\b|stay consistent\b|stay motivated\b/.test(low)) {
    return "guide";
  }
  if (/\bstrategy\b|\bways to\b|\btips for\b/.test(low)) return "guide";
  if (/\bideas\b|\bcaptions\b|\bhooks?\b/.test(low)) return "ideas";
  return undefined;
}

/** Stiff or template-stacked guide lines (SEO sites rarely publish these). */
function unnaturalGuideTopic(topic: string): string | null {
  const low = topic.toLowerCase();
  const guideLike =
    /\bhow\b/.test(low) ||
    /\bbeginner guide\b|best ways\b|\bguide to\b/.test(low) ||
    (/\btips for\b/.test(low) && /\blow views\b/.test(low)) ||
    /\bstay consistent\b|stay motivated\b|without burnout\b/.test(low);
  if (!guideLike) return null;

  if (/struggling with stuck/i.test(topic)) return "awkward_struggling_stuck";
  if ((topic.match(/\bfor beginners\b/gi) || []).length >= 2) return "duplicate_beginners";
  if (/how to grow on .+ and .+ as .+/i.test(topic)) return "stacked_grow_clause";
  if (/\b(gym|coffee|skincare|outfit|morning routine)\b/i.test(topic) && /\b(small business|saas|b2b)\b/i.test(low)) {
    return "mismatched_scene_commercial";
  }
  if (topic.split(/\s+/).filter(Boolean).length > 15 && /\b(morning routine|gym|coffee)\b/i.test(topic)) {
    return "overstacked_modifiers";
  }
  return null;
}

/**
 * Pre-filter generated topic strings before expensive rebuild (length, intent, awkward combos, dedup).
 */
export function evaluateTopicReadiness(input: TopicReadinessInput): TopicReadinessResult {
  const reasons: string[] = [];
  const topic = input.topic.replace(/\s+/g, " ").trim();
  const existing = input.existingTitles ?? [];

  if (!topic) {
    return { decision: "reject", reasons: ["empty_topic"], score: 0 };
  }

  if (topic.length < 18 || topic.length > 80) {
    reasons.push("length_out_of_range");
    return { decision: "reject", reasons, score: 20 };
  }

  if (!INTENT_RE.test(topic)) {
    reasons.push("missing_intent_keyword");
    return { decision: "reject", reasons, score: 25 };
  }

  const words = topic.split(" ").filter(Boolean);
  if (words.length > 16) {
    reasons.push("modifier_stack_too_long");
    return { decision: "reject", reasons, score: 30 };
  }

  if (/for girls/i.test(topic) && /small business|b2b|\bsaas\b|revenue/i.test(topic)) {
    reasons.push("awkward_girls_commercial_mix");
    return { decision: "reject", reasons, score: 22 };
  }

  const preType = inferContentType(topic);
  const awkwardGuide = unnaturalGuideTopic(topic);
  if (awkwardGuide && preType === "guide") {
    reasons.push(`unnatural_guide:${awkwardGuide}`);
    return { decision: "reject", reasons, score: 27 };
  }

  if (
    /small business/i.test(topic) &&
    /\bcaption\b/i.test(topic) &&
    !/\b(post ideas|content ideas|hook ideas|caption ideas)\b/i.test(topic)
  ) {
    reasons.push("awkward_smb_caption_only");
    return { decision: "rewrite", reasons, score: 48 };
  }

  const sim = maxTitleSimilarity(topic, existing);
  const strictDup = existing.some((t) => isStrictDuplicateTopic(topic, String(t ?? "")));
  if (sim >= SIM_REJECT && strictDup) {
    /** TASK20 EN: duplicate enforcement deferred to publish_gate; soft-pass for observability. */
    const contentType = preType ?? inferContentType(topic);
    let score = 86;
    if (topic.length >= 36) score += 5;
    if (words.length >= 8 && words.length <= 13) score += 5;
    return {
      decision: "pass",
      reasons: ["topic_gate_softpass:title_duplicate:content_jaccard"],
      score: Math.min(100, score),
      contentType,
    };
  }
  if (sim >= SIM_REWRITE) {
    reasons.push(`high_similarity:content_jaccard=${sim.toFixed(3)}`);
    return { decision: "rewrite", reasons, score: 50 };
  }

  const contentType = preType ?? inferContentType(topic);
  let score = 86;
  if (topic.length >= 36) score += 5;
  if (words.length >= 8 && words.length <= 13) score += 5;
  return { decision: "pass", reasons: [], score: Math.min(100, score), contentType };
}
