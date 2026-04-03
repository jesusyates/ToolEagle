/**
 * EN auto-posts quality audit (read-only rules). Used by audit CLI + rebuild pipeline.
 */

import matter from "gray-matter";

const CJK = /[\u4e00-\u9fff]/;
const MIN_BODY = 350;
const SOFT_BODY = 1200;
const MIN_ANSWER_SOFT = 60;
const ANSWER_FREEZE_BELOW = 28;
const MIN_AI_SUMMARY = 80;
const MIN_H2 = 4;

export type PublishedGuideAuditDecision = "pass" | "repair" | "freeze";

export type PublishedGuideAuditResult = {
  filename: string;
  title: string;
  decision: PublishedGuideAuditDecision;
  reasons: string[];
};

function stripMd(s: string): string {
  return s.replace(/```[\s\S]*?```/g, " ").replace(/[#*_`[\]()]/g, " ").replace(/\s+/g, " ").trim();
}

function wordTokens(s: string): Set<string> {
  const m = s.toLowerCase().match(/\b[a-z]{3,}\b/g);
  return new Set(m ?? []);
}

function titleBodyOverlap(title: string, bodySample: string): number {
  const t = wordTokens(title);
  const b = wordTokens(bodySample);
  if (t.size === 0) return 1;
  let inter = 0;
  for (const w of t) if (b.has(w)) inter++;
  return inter / t.size;
}

function extractAnswerBlock(body: string, data: Record<string, unknown>): string {
  const ai = typeof data.aiSummary === "string" ? data.aiSummary.trim() : "";
  if (ai.length >= MIN_AI_SUMMARY) return ai;
  const m =
    /^[\s\S]*?\n##\s+Answer[^\n]*\n([\s\S]*?)(?=\n##\s|\s*$)/i.exec(body) ||
    /^[\s\S]*?\n##\s+Direct answer[^\n]*\n([\s\S]*?)(?=\n##\s|\s*$)/i.exec(body);
  if (m) return stripMd(m[1]).slice(0, 800);
  const intro =
    /^[\s\S]*?\n##\s+Introduction[^\n]*\n([\s\S]*?)(?=\n##\s)/i.exec(body);
  if (intro) return stripMd(intro[1]).slice(0, 800);
  return stripMd(body).slice(0, 500);
}

function hasFaq(body: string, data: Record<string, unknown>): boolean {
  if (Array.isArray(data.faqs) && data.faqs.length > 0) return true;
  if (/\n##\s+FAQ/i.test(body) || /\n###\s+Q\d?/i.test(body)) return true;
  if (/\n##\s+Common mistakes/i.test(body) && /\n##\s+Practical tips/i.test(body)) return true;
  return false;
}

function h2Count(body: string): number {
  const m = body.match(/^##\s+[^\n]+/gm);
  return m?.length ?? 0;
}

function duplicateSentenceHits(body: string): { worst: number; lineDup: number } {
  const plain = stripMd(body);
  const sentences = plain
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 25);
  const counts = new Map<string, number>();
  for (const s of sentences) counts.set(s, (counts.get(s) ?? 0) + 1);
  let worst = 0;
  for (const c of counts.values()) worst = Math.max(worst, c);

  const lines = plain
    .split(/\n/)
    .map((l) => l.trim().toLowerCase())
    .filter((l) => l.length > 40);
  const lc = new Map<string, number>();
  for (const l of lines) lc.set(l, (lc.get(l) ?? 0) + 1);
  let lineDup = 0;
  for (const c of lc.values()) lineDup = Math.max(lineDup, c);
  return { worst, lineDup };
}

function templatePhrases(body: string): number {
  const t = body.toLowerCase();
  const needles = [
    "this guide assumes you publish",
    "you will leave with a clear order of operations",
    "readers searching for"
  ];
  let n = 0;
  for (const p of needles) {
    const re = new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    const m = t.match(re);
    if (m) n += m.length;
  }
  return n;
}

/** Full audit for one markdown document (body + frontmatter). */
export function auditPublishedGuideMarkdown(filename: string, raw: string): PublishedGuideAuditResult {
  const { data, content: body } = matter(raw);
  const title = typeof data.title === "string" ? data.title : filename.replace(/\.md$/i, "");
  const reasons: string[] = [];

  if (CJK.test(raw)) reasons.push("contains_chinese");

  const bodyLen = body.trim().length;
  if (bodyLen < MIN_BODY) reasons.push("body_too_short");
  else if (bodyLen < SOFT_BODY) reasons.push("body_below_soft_threshold");

  const answerText = extractAnswerBlock(body, data as Record<string, unknown>);
  if (answerText.length < ANSWER_FREEZE_BELOW) reasons.push("answer_block_missing_or_critical");
  else if (answerText.length < MIN_ANSWER_SOFT) reasons.push("answer_block_short");

  if (!hasFaq(body, data as Record<string, unknown>)) reasons.push("faq_missing");

  const h2 = h2Count(body);
  if (h2 < MIN_H2) reasons.push("insufficient_h2_sections");

  const { worst, lineDup } = duplicateSentenceHits(body);
  if (worst >= 3) reasons.push("duplicate_sentence");
  if (lineDup >= 3) reasons.push("repeated_paragraph_block");

  const tpl = templatePhrases(body);
  if (tpl >= 4) reasons.push("strong_template_wording");

  const overlap = titleBodyOverlap(title, body.slice(0, 2500));
  if (overlap < 0.12) reasons.push("title_body_keyword_overlap_low");

  let decision: PublishedGuideAuditDecision = "pass";
  const freezeSet = new Set([
    "contains_chinese",
    "body_too_short",
    "answer_block_missing_or_critical",
    "repeated_paragraph_block"
  ]);
  const hasFreeze = reasons.some((r) => freezeSet.has(r));
  if (hasFreeze) decision = "freeze";
  else if (reasons.length > 0) decision = "repair";

  return { filename, title, decision, reasons };
}
