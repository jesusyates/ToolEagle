/**
 * 中文发布前标题去重与结构底线（与英文 publish-gate 同级，面向中文分词/字元）。
 */

export type ZhPublishReadinessInput = {
  title: string;
  body: string;
  existingTitles?: string[];
};

export type ZhPublishReadinessResult = {
  decision: "pass" | "rewrite" | "reject";
  reasons: string[];
  score: number;
};

const SIM_REJECT = 0.9;
const SIM_REWRITE = 0.7;

function cjkBigrams(s: string): Set<string> {
  const t = s.replace(/[^\u4e00-\u9fff]/g, "");
  const set = new Set<string>();
  for (let i = 0; i < t.length - 1; i++) {
    set.add(t.slice(i, i + 2));
  }
  return set;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

function maxTitleSimilarityZh(title: string, existingTitles: string[]): number {
  const a = cjkBigrams(title);
  if (a.size === 0) return 0;
  let max = 0;
  for (const t of existingTitles) {
    const s = String(t ?? "").trim();
    if (!s) continue;
    max = Math.max(max, jaccard(a, cjkBigrams(s)));
  }
  return max;
}

function paragraphCount(body: string): number {
  return body
    .trim()
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0).length;
}

/**
 * 中文 publish-gate：标题长度、正文长度、段落数、与已有标题字元 bigram 相似度。
 */
export function evaluateZhPublishReadiness(input: ZhPublishReadinessInput): ZhPublishReadinessResult {
  const reasons: string[] = [];
  const title = input.title.trim();
  const body = input.body.trim();
  const existing = input.existingTitles ?? [];

  if (!title) {
    return { decision: "reject", reasons: ["empty_title"], score: 0 };
  }

  if (title.length < 8) {
    reasons.push("title_too_short");
    return { decision: "reject", reasons, score: 25 };
  }

  if (body.length < 200) {
    reasons.push("body_too_short");
    return { decision: "reject", reasons, score: 30 };
  }

  const paras = paragraphCount(body);
  if (paras < 2) {
    reasons.push("insufficient_paragraphs");
    return { decision: "reject", reasons, score: 35 };
  }

  const sim = maxTitleSimilarityZh(title, existing);
  if (sim >= SIM_REJECT) {
    reasons.push(`near_duplicate_title:jaccard_zh=${sim.toFixed(3)}`);
    return { decision: "reject", reasons, score: 20 };
  }
  if (sim >= SIM_REWRITE) {
    reasons.push(`similar_title:jaccard_zh=${sim.toFixed(3)}`);
    return { decision: "rewrite", reasons, score: 52 };
  }

  let score = 88;
  if (title.length >= 18) score += 4;
  if (body.length >= 500) score += 4;
  if (paras >= 4) score += 4;
  return { decision: "pass", reasons: [], score: Math.min(100, score) };
}
