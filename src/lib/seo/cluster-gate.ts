export type ClusterReadinessInput = {
  cluster: string;
};

export type ClusterReadinessResult = {
  decision: "pass" | "rewrite" | "reject";
  reasons: string[];
  score: number;
};

/** Too vague / product-marketing style; whole-word match. */
const ABSTRACT_WORD_RE = /\b(momentum|blueprint|system|framework|engine)\b/i;

const POSITIVE_SIGNALS: { tag: string; re: RegExp; bonus: number }[] = [
  { tag: "consistency", re: /\bconsistency\b/i, bonus: 8 },
  { tag: "growth", re: /\bgrowth\b/i, bonus: 8 },
  { tag: "content_planning", re: /\bcontent planning\b/i, bonus: 10 },
  { tag: "low_views", re: /\blow views\b/i, bonus: 8 },
  { tag: "burnout", re: /\bburnout\b/i, bonus: 8 },
  { tag: "beginners", re: /\bbeginners?\b/i, bonus: 8 },
  /** Operational hub (batching / workflow), not empty jargon. */
  { tag: "batching_workflow", re: /\b(batch|batching|workflow)\b/i, bonus: 6 }
];

/** Reads like a hub (platform / cross-platform), not a one-line slogan. */
function hubBonus(s: string): number {
  let b = 0;
  if (/\btiktok\b/i.test(s)) b += 6;
  if (/\binstagram\b/i.test(s)) b += 6;
  if (/\byoutube\b/i.test(s)) b += 6;
  if (/\bcross[- ]platform\b/i.test(s)) b += 8;
  return Math.min(b, 14);
}

function wordCount(s: string): number {
  return s.split(/\s+/).filter(Boolean).length;
}

/**
 * Minimal cluster gate: length, abstract vocabulary, hub-like theme vs slogan.
 */
export function evaluateClusterReadiness(input: ClusterReadinessInput): ClusterReadinessResult {
  const cluster = String(input.cluster ?? "").replace(/\s+/g, " ").trim();
  const reasons: string[] = [];

  if (cluster.length < 18 || cluster.length > 70) {
    return {
      decision: "reject",
      reasons: ["length_out_of_range"],
      score: 0
    };
  }

  const abstract = cluster.match(ABSTRACT_WORD_RE);
  if (abstract) {
    return {
      decision: "reject",
      reasons: [`abstract_word:${String(abstract[1]).toLowerCase()}`],
      score: 18
    };
  }

  let score = 48;
  const positives: string[] = [];
  for (const p of POSITIVE_SIGNALS) {
    if (p.re.test(cluster)) {
      score += p.bonus;
      positives.push(p.tag);
    }
  }
  if (positives.length) reasons.push(`positive:${positives.join(",")}`);

  const hb = hubBonus(cluster);
  if (hb > 0) {
    score += hb;
    reasons.push("hub_signal");
  }

  const wc = wordCount(cluster);
  if (wc < 4) {
    score -= 18;
    reasons.push("too_few_words");
  }

  /** Slogan-like: very short line with no hub signal and no positive. */
  if (cluster.length < 28 && hb === 0 && positives.length === 0) {
    score -= 15;
    reasons.push("slogan_like");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  if (score >= 58) {
    return { decision: "pass", reasons: reasons.length ? reasons : ["ok"], score };
  }
  if (score >= 42) {
    return { decision: "rewrite", reasons: [...reasons, "score_below_pass_threshold"], score };
  }
  return { decision: "reject", reasons: [...reasons, "score_too_low"], score };
}
