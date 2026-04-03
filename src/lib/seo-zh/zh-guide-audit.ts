/**
 * 中文正式稿 / staged 终审（read-only）。与英文 published-guide-audit 同级，规则面向中文。
 */

import matter from "gray-matter";
import {
  collectForbiddenEnglishKeysInData,
  mapZhGuideDataToRecordFields,
  parseZhFaqsFromData,
  ZH_KEY
} from "./zh-frontmatter-keys";

const LATIN_RUN = /[A-Za-z]{3,}/;
const EN_PLATFORM = /\b(tiktok|instagram|youtube|facebook|twitter|linkedin|meta|reels|shorts|snapchat|pinterest)\b/i;

export type ZhGuideAuditDecision = "pass" | "repair" | "freeze";

export type ZhGuideAuditResult = {
  filename: string;
  title: string;
  decision: ZhGuideAuditDecision;
  reasons: string[];
};

function stripMd(s: string): string {
  return s.replace(/```[\s\S]*?```/g, " ").replace(/[#*_`[\]()]/g, " ").replace(/\s+/g, " ").trim();
}

function hasFaq(body: string, data: Record<string, unknown>): boolean {
  const faqs = parseZhFaqsFromData(data);
  if (faqs && faqs.length >= 2) return true;
  if (/\n##\s*常见/i.test(body) || /\n##\s*FAQ/i.test(body) || /\n###\s*问/i.test(body)) return true;
  return false;
}

function h2Count(body: string): number {
  const m = body.match(/^##\s+[^\n]+/gm);
  return m?.length ?? 0;
}

function contentParagraphCount(body: string): number {
  return body
    .split(/\n{2,}/)
    .map((s) => stripMd(s.trim()))
    .filter((s) => s.length >= 25)
    .length;
}

function duplicateSentenceReasons(text: string): string[] {
  const plain = stripMd(text).replace(/\s+/g, " ");
  const parts = plain
    .split(/[。！？.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 22);
  const counts = new Map<string, number>();
  for (const p of parts) {
    counts.set(p, (counts.get(p) ?? 0) + 1);
  }
  for (const [, c] of counts) {
    if (c >= 2) return ["duplicate_sentence"];
  }
  return [];
}

function templateParagraphReasons(body: string): string[] {
  const paras = body
    .split(/\n{2,}/)
    .map((s) => stripMd(s.trim()))
    .filter((s) => s.length > 55);
  const keys = new Map<string, number>();
  for (const p of paras) {
    const key = p.slice(0, 120).replace(/\s+/g, "");
    if (key.length < 40) continue;
    keys.set(key, (keys.get(key) ?? 0) + 1);
  }
  for (const [, c] of keys) {
    if (c >= 2) return ["template_repetitive_paragraph"];
  }
  return [];
}

function extractAnswerZh(body: string, data: Record<string, unknown>): string {
  const mrec = mapZhGuideDataToRecordFields(data);
  const ai = (mrec.aiSummary ?? "").trim();
  if (ai.length >= 40) return ai;
  const m =
    /\n##\s*回答[^\n]*\n([\s\S]*?)(?=\n##|\s*$)/.exec(body) ||
    /\n##\s*简介[^\n]*\n([\s\S]*?)(?=\n##|\s*$)/.exec(body);
  if (m) return stripMd(m[1]).slice(0, 800);
  return stripMd(body).slice(0, 500);
}

function collectZhTextForScan(data: Record<string, unknown>, body: string): string {
  const m = mapZhGuideDataToRecordFields(data);
  const parts: string[] = [body, m.title, m.description, m.aiSummary ?? ""];
  if (m.faqs) {
    for (const f of m.faqs) {
      parts.push(f.question, f.answer);
    }
  }
  for (const h of m.hashtags) parts.push(h);
  return parts.join("\n");
}

/** 终审：写入 zh-staged / 发布到 zh-guides 前调用。frontmatter 须为中文键名。 */
export function auditZhGuideMarkdown(filename: string, raw: string): ZhGuideAuditResult {
  const { data, content: body } = matter(raw);
  const d = data as Record<string, unknown>;
  const mapped = mapZhGuideDataToRecordFields(d);
  const title = mapped.title.trim() || filename.replace(/\.md$/i, "");

  const forbidden = collectForbiddenEnglishKeysInData(d);
  if (forbidden.length > 0) {
    return {
      filename,
      title,
      decision: "freeze",
      reasons: ["contains_english_frontmatter_keys"]
    };
  }

  const reasons: string[] = [];

  const scan = collectZhTextForScan(d, body);
  if (LATIN_RUN.test(scan)) reasons.push("contains_english_latin");
  if (EN_PLATFORM.test(scan)) reasons.push("contains_english_platform_token");

  const bodyLen = body.trim().length;
  if (bodyLen < 120) reasons.push("body_too_short");
  else if (bodyLen < 350) reasons.push("body_below_soft_threshold");

  const answerText = extractAnswerZh(body, d);
  if (answerText.length < 20) reasons.push("answer_block_missing_or_critical");
  else if (answerText.length < 45) reasons.push("answer_block_short");

  if (!hasFaq(body, d)) reasons.push("faq_missing");

  const h2 = h2Count(body);
  if (h2 < 3) reasons.push("insufficient_h2_sections");

  const paraN = contentParagraphCount(body);
  if (paraN < 4) reasons.push("insufficient_paragraphs");

  reasons.push(...duplicateSentenceReasons(scan));
  reasons.push(...templateParagraphReasons(body));

  const reasonsOut = [...new Set(reasons)];

  let decision: ZhGuideAuditDecision = "pass";
  const freezeSet = new Set([
    "contains_english_latin",
    "contains_english_platform_token",
    "body_too_short",
    "answer_block_missing_or_critical",
    "contains_english_frontmatter_keys"
  ]);
  const hasFreeze = reasonsOut.some((r) => freezeSet.has(r));
  if (hasFreeze) decision = "freeze";
  else if (reasonsOut.length > 0) decision = "repair";

  return { filename, title, decision, reasons: reasonsOut };
}

export type ZhStagedGuideAuditDecision = "pass" | "rewrite" | "reject";

export type ZhStagedGuideAuditResult = {
  filename: string;
  title: string;
  decision: ZhStagedGuideAuditDecision;
  reasons: string[];
};

export function auditZhStagedGuideMarkdown(filename: string, raw: string): ZhStagedGuideAuditResult {
  const b = auditZhGuideMarkdown(filename, raw);
  let decision: ZhStagedGuideAuditDecision;
  if (b.decision === "pass") decision = "pass";
  else if (b.decision === "freeze") decision = "reject";
  else decision = "rewrite";
  return { filename: b.filename, title: b.title, decision, reasons: b.reasons };
}
