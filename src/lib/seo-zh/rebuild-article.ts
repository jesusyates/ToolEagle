/**
 * 中文经验复盘型 guide：与英文共用 `rebuild-article.ts`（DeepSeek + 中文质检）。
 * 生成后对正文做拉丁字母清洗，以与 zh-language-gate（连续 3+ 拉丁字母）及语言纯度对齐。
 */

import { rebuildToSeoArticle } from "@/lib/seo/rebuild-article";

export type ZhFaqItem = { question: string; answer: string };

export type ZhRebuildArticleInput = {
  title: string;
  context?: string;
  platform: "douyin" | "xiaohongshu";
  contentType?: "guide";
};

export type ZhLanguagePurity = { pass: boolean; reason?: string };

export type ZhRebuildArticleResult = {
  title: string;
  body: string;
  aiSummary: string;
  faqs: ZhFaqItem[];
  hashtags: string[];
  languagePurity: ZhLanguagePurity;
};

/** 连续拉丁字母 >6（≥7）即不通过（与生成后清洗配合） */
const CONSECUTIVE_LATIN_OVER_6 = /[A-Za-z]{7,}/;

const FORBIDDEN_EN_PLATFORM = /\b(tiktok|instagram|youtube|facebook|twitter|linkedin|meta|reels|shorts|snapchat|pinterest)\b/i;

const DEFAULT_ZH_HASHTAGS = ["#短视频", "#创作者", "#运营", "#内容"];

/** 单行字段：去拉丁串并压空白（标题/摘要/问答）。 */
function scrubLatinInline(s: string): string {
  return s.replace(/[A-Za-z]{3,}/g, "").replace(/\s{2,}/g, " ").trim();
}

/** 正文：只删拉丁串，保留换行与段落空行（避免段落被压成一段导致 gate/终审失败）。 */
function scrubLatinPreserveParagraphs(s: string): string {
  return s.replace(/[A-Za-z]{3,}/g, "");
}

function sanitizeZhRebuildOutput(
  base: Omit<ZhRebuildArticleResult, "languagePurity">
): Omit<ZhRebuildArticleResult, "languagePurity"> {
  const title = scrubLatinInline(base.title) || base.title;
  const body = scrubLatinPreserveParagraphs(base.body);
  const aiSummary = scrubLatinInline(base.aiSummary);
  const faqs = base.faqs.map((f) => ({
    question: scrubLatinInline(f.question),
    answer: scrubLatinInline(f.answer)
  }));
  const hashtags = base.hashtags
    .map((h) => (h.startsWith("#") ? h : `#${h.replace(/^#+/, "")}`))
    .filter((h) => !/[A-Za-z]{3,}/.test(h));
  const hashtagsOut =
    hashtags.length >= 4 ? hashtags.slice(0, 8) : [...DEFAULT_ZH_HASHTAGS];
  return { title, body, aiSummary, faqs, hashtags: hashtagsOut };
}

export function evaluateZhRebuildLanguagePurity(result: Omit<ZhRebuildArticleResult, "languagePurity">): ZhLanguagePurity {
  const blob = [
    result.title,
    result.body,
    result.aiSummary,
    ...result.faqs.flatMap((f) => [f.question, f.answer]),
    ...result.hashtags
  ].join("\n");
  if (CONSECUTIVE_LATIN_OVER_6.test(blob)) {
    return { pass: false, reason: "consecutive_latin_over_6" };
  }
  if (FORBIDDEN_EN_PLATFORM.test(blob)) {
    return { pass: false, reason: "forbidden_english_platform_token" };
  }
  return { pass: true };
}

export async function rebuildToZhGuideArticle(input: ZhRebuildArticleInput): Promise<ZhRebuildArticleResult> {
  const platformLabel = input.platform === "douyin" ? "抖音" : "小红书";
  const context = [input.context?.trim(), `平台:${platformLabel}`].filter(Boolean).join("\n");

  const result = await rebuildToSeoArticle({
    title: input.title.trim(),
    context,
    contentType: input.contentType ?? "guide",
    language: "zh"
  });

  const base: Omit<ZhRebuildArticleResult, "languagePurity"> = {
    title: result.title,
    body: result.body,
    aiSummary: result.aiSummary,
    faqs: result.faqs,
    hashtags: result.hashtags
  };
  const sanitized = sanitizeZhRebuildOutput(base);
  const languagePurity = evaluateZhRebuildLanguagePurity(sanitized);
  return { ...sanitized, languagePurity };
}
