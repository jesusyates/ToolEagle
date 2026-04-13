/**
 * Final gate before EN staged-guides write: discard + retry upstream if any rule fails.
 */

/** Min English body word count (markdown-stripped); relaxed from 800 to reduce false rejects. */
export const MIN_EN_BODY_WORDS_PRESTAGED = 650;

export type PreStagedQualityResult = { ok: true } | { ok: false; reason: string };

function countEnglishWords(markdownBody: string): number {
  const t = markdownBody
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^#+\s+.*$/gm, " ")
    .replace(/\*\*|__/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  return t
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0 && /[a-zA-Z]/.test(w)).length;
}

/** Lines like `1. ` `2. ` ... (ordered list) — 3+ such lines = reject. */
function hasOrderedListStructure(body: string): boolean {
  let n = 0;
  for (const line of body.split("\n")) {
    if (/^\s*\d+\.\s+\S/.test(line.trim())) n++;
  }
  return n >= 3;
}

function hasFirstPerson(body: string): boolean {
  return /\bI\b|\bI['’]m\b|\bI['’]ve\b|\bI['’]d\b|\bI['’]ll\b|我/.test(body);
}

function hasSummaryPhrase(blob: string): boolean {
  return /总结来说/.test(blob) || /\bin conclusion\b/i.test(blob);
}

export function evaluatePreStagedQualityGate(input: {
  body: string;
  cluster: string;
  title?: string;
  aiSummary?: string;
  faqs?: { question: string; answer: string }[];
}): PreStagedQualityResult {
  const cluster = input.cluster ?? "";
  const blob = [
    cluster,
    input.title ?? "",
    input.body,
    input.aiSummary ?? "",
    ...(input.faqs?.flatMap((f) => [f.question, f.answer]) ?? [])
  ].join("\n");

  if (blob.includes("SEO fallback pool")) {
    console.log(`[pre-staged-qg-detail] reject reason=seo_fallback_pool`);
    return { ok: false, reason: "seo_fallback_pool" };
  }
  if (hasOrderedListStructure(input.body)) {
    console.log(`[pre-staged-qg-detail] reject reason=ordered_list`);
    return { ok: false, reason: "ordered_list" };
  }
  if (!hasFirstPerson(input.body)) {
    console.log(`[pre-staged-qg-detail] reject reason=no_first_person`);
    return { ok: false, reason: "no_first_person" };
  }
  if (hasSummaryPhrase(blob)) {
    console.log(`[pre-staged-qg-detail] reject reason=summary_phrase`);
    return { ok: false, reason: "summary_phrase" };
  }
  const wc = countEnglishWords(input.body);
  if (wc < MIN_EN_BODY_WORDS_PRESTAGED) {
    console.log(
      `[pre-staged-qg-detail] reject reason=short_body_words wordCount=${wc} minWords=${MIN_EN_BODY_WORDS_PRESTAGED}`
    );
    return { ok: false, reason: `short_body_words_${wc}` };
  }
  return { ok: true };
}
