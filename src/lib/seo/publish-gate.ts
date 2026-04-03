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
const SIM_REJECT = 0.9;
const SIM_REWRITE = 0.7;
const NEAR_DUPLICATE_TRIGRAM_REJECT = 0.9;

function normalizeForTokens(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(s: string): Set<string> {
  return new Set(normalizeForTokens(s).split(" ").filter((w) => w.length > 2));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

function maxTitleSimilarity(title: string, existingTitles: string[]): number {
  const a = tokenSet(title);
  if (a.size === 0) return 0;
  let max = 0;
  for (const t of existingTitles) {
    const s = String(t ?? "").trim();
    if (!s) continue;
    max = Math.max(max, jaccard(a, tokenSet(s)));
  }
  return max;
}

function trigramSet(s: string): Set<string> {
  const t = normalizeForTokens(s).replace(/\s+/g, " ").trim();
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

function hasNearDuplicateTitle(title: string, existingTitles: string[]): boolean {
  const normalized = normalizeForTokens(title);
  for (const t of existingTitles) {
    const s = String(t ?? "").trim();
    if (!s) continue;
    if (normalizeForTokens(s) === normalized) return true;
    const tokenJ = jaccard(tokenSet(title), tokenSet(s));
    if (tokenJ < SIM_REJECT) continue;
    const triJ = trigramJaccardTitle(title, s);
    if (triJ >= NEAR_DUPLICATE_TRIGRAM_REJECT) return true;
  }
  return false;
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

  const sim = maxTitleSimilarity(title, existing);
  if (hasNearDuplicateTitle(title, existing)) {
    reasons.push(`near_duplicate_title:jaccard=${sim.toFixed(3)}`);
    return { decision: "reject", reasons, score: 20 };
  }
  if (sim >= SIM_REWRITE) {
    reasons.push(`similar_title:jaccard=${sim.toFixed(3)}`);
    return { decision: "rewrite", reasons, score: 52 };
  }

  let score = 88;
  if (title.length >= 35) score += 4;
  if (body.length >= 1200) score += 4;
  if (paras >= 5) score += 4;
  return { decision: "pass", reasons: [], score: Math.min(100, score) };
}
