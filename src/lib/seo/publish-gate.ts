import { enContentTokenJaccard, enContentTokenSet, normalizeEnTitleForDedup } from "./title-dedup-tokens";

export type PublishReadinessInput = {
  title: string;
  body: string;
  existingTitles?: string[];
};

export type PublishReadinessResult = {
  decision: "pass" | "rewrite" | "reject";
  reasons: string[];
  score: number;
};

const LOW_VALUE_TITLE = [/^test/i, /^untitled/i, /^post about/i];
/** Content-token overlap must be high before trigram confirms near-duplicate (stopwords stripped). */
const SIM_REJECT = 0.92;
const SIM_REWRITE = 0.7;
const NEAR_DUPLICATE_TRIGRAM_REJECT = 0.9;

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

function maxTitleSimilarity(title: string, existingTitles: string[]): number {
  let max = 0;
  for (const t of existingTitles) {
    const s = String(t ?? "").trim();
    if (!s) continue;
    max = Math.max(max, enContentTokenJaccard(title, s));
  }
  return max;
}

function trigramSet(s: string): Set<string> {
  const t = normalizeEnTitleForDedup(s).replace(/\s+/g, " ").trim();
  const out = new Set<string>();
  if (t.length < 3) {
    if (t) out.add(t);
    return out;
  }
  for (let i = 0; i < t.length - 2; i++) out.add(t.slice(i, i + 3));
  return out;
}

function trigramJaccardTitle(aTitle: string, bTitle: string): number {
  return jaccard(trigramSet(aTitle), trigramSet(bTitle));
}

/**
 * TASK22: No hard reject on title_duplicate here — token+trigram often hit 1.0 vs corpus and zero yield.
 * Borderline (legacy near-dup band) → softpass + metrics; stricter duplicate handling stays in final_audit.
 */
function publishGateTitleDupLevel(
  title: string,
  existingTitles: string[]
): { level: "softpass" | "none"; sim: number } {
  const sim = maxTitleSimilarity(title, existingTitles);
  let borderlineNearDup = false;
  for (const t of existingTitles) {
    const s = String(t ?? "").trim();
    if (!s) continue;
    const a = enContentTokenSet(title);
    const b = enContentTokenSet(s);
    if (a.size < 3 || b.size < 3) continue;
    const cj = enContentTokenJaccard(title, s);
    if (cj < SIM_REJECT) continue;
    const triJ = trigramJaccardTitle(title, s);
    if (triJ >= NEAR_DUPLICATE_TRIGRAM_REJECT) borderlineNearDup = true;
  }
  if (borderlineNearDup) return { level: "softpass", sim };
  return { level: "none", sim };
}

function paragraphCount(body: string): number {
  return body
    .trim()
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0).length;
}

/**
 * Minimal pre-publish quality gate (length, structure, title patterns, title dedup vs existing).
 */
export function evaluatePublishReadiness(input: PublishReadinessInput): PublishReadinessResult {
  const reasons: string[] = [];
  const title = input.title.trim();
  const body = input.body.trim();
  const existing = input.existingTitles ?? [];

  if (!title) {
    return { decision: "reject", reasons: ["empty_title"], score: 0 };
  }

  for (const re of LOW_VALUE_TITLE) {
    if (re.test(title)) {
      reasons.push(`low_value_title:${re.source}`);
      return { decision: "reject", reasons, score: 15 };
    }
  }

  if (title.length < 20) {
    reasons.push("title_too_short");
    return { decision: "reject", reasons, score: 25 };
  }

  if (body.length < 600) {
    reasons.push("body_too_short");
    return { decision: "reject", reasons, score: 30 };
  }

  const paras = paragraphCount(body);
  if (paras < 3) {
    reasons.push("insufficient_paragraphs");
    return { decision: "reject", reasons, score: 35 };
  }

  const dup = publishGateTitleDupLevel(title, existing);
  const sim = dup.sim;
  if (dup.level === "softpass") {
    let score = 88;
    if (title.length >= 35) score += 4;
    if (body.length >= 1200) score += 4;
    if (paras >= 5) score += 4;
    return {
      decision: "pass",
      reasons: ["publish_gate_softpass:title_duplicate:content_jaccard"],
      score: Math.min(100, score),
    };
  }
  if (sim >= SIM_REWRITE) {
    reasons.push(`high_similarity:content_jaccard=${sim.toFixed(3)}`);
    return { decision: "rewrite", reasons, score: 52 };
  }

  let score = 88;
  if (title.length >= 35) score += 4;
  if (body.length >= 1200) score += 4;
  if (paras >= 5) score += 4;
  return { decision: "pass", reasons: [], score: Math.min(100, score) };
}
