/**
 * V66 Programmatic Blog Layer - blog version of keyword pages
 * /zh/blog/[slug] - same slugs as /zh/search/[slug]
 */

import { getAllKeywordSlugsWithContent } from "./zh-keyword-content";
import { getKeywordBySlug } from "./keyword-patterns";
import { getKeywordContent } from "./zh-keyword-content";
import { getRelatedKeywordsFiltered } from "./keyword-patterns";
import type { KeywordEntry } from "./keyword-patterns";
import type { ZhKeywordContent } from "./zh-keyword-content";

export function getAllBlogSlugs(): string[] {
  return getAllKeywordSlugsWithContent();
}

export function getBlogBySlug(slug: string): {
  entry: KeywordEntry;
  content: ZhKeywordContent;
} | null {
  const entry = getKeywordBySlug(slug);
  const content = getKeywordContent(slug);
  if (!entry || !content) return null;
  return { entry, content };
}

/** Get 1-2 related blog slugs for cross-linking (same platform or goal) */
export function getRelatedBlogSlugs(entry: KeywordEntry, existingSlugs: Set<string>, limit = 2): { slug: string; label: string }[] {
  const related = getRelatedKeywordsFiltered(entry, existingSlugs, limit);
  return related.map((r) => ({ slug: r.slug, label: r.keyword }));
}
