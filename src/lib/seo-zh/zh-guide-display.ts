/**
 * 中文指南页展示：Answer / FAQ 抽取（与英文 getPublishedGuideAnswer 行为对齐，面向中文正文）。
 */

import type { FaqItem } from "@/lib/seo/rebuild-article";
import type { ZhGuideRecord } from "@/lib/zh-guides-reader";

/** JSON-LD / 展示用：去掉连续拉丁字母片段，便于纯中文输出（不改存储字段）。 */
export function sanitizeZhDisplayForJsonLd(s: string): string {
  if (!s) return s;
  return s.replace(/[A-Za-z]{2,}/g, "").replace(/\s{2,}/g, " ").trim();
}

export function getZhPublishedGuideAnswer(post: ZhGuideRecord): string {
  if (post.aiSummary?.trim()) return post.aiSummary.trim();
  const m = /\n##\s*回答[^\n]*\n([\s\S]*?)(?=\n##|\s*$)/.exec(post.body);
  if (m) return m[1].replace(/^#+\s*/gm, "").trim().slice(0, 600);
  const intro = /\n##\s*简介[^\n]*\n([\s\S]*?)(?=\n##|\s*$)/.exec(post.body);
  if (intro) return intro[1].replace(/^#+\s*/gm, "").trim().slice(0, 600);
  return post.title;
}

export function getZhPublishedGuideFaqs(post: ZhGuideRecord): FaqItem[] {
  if (post.faqs && post.faqs.length >= 2) return post.faqs.slice(0, 8);
  return [];
}
