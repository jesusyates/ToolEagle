/**
 * V79: Related questions and answer index data.
 * Ensure every page links to: 5 keyword pages, 3 how-to pages, 3 tool pages.
 */

import { getRelatedKeywordsFiltered } from "./keyword-patterns";
import type { KeywordEntry } from "./keyword-patterns";
import { getAllKeywordSlugsWithContent } from "./zh-keyword-content";
import { getZhInternalLinks } from "./generate-zh-content";
import { ZH_BASE_PATHS } from "./zh-hub-data";
import type { GuidePageType } from "@/config/traffic-topics";
import { tools } from "@/config/tools";

export type RelatedLink = { href: string; label: string };

/** For ZhKeywordPageTemplate: 10–20 related question links */
export function getRelatedQuestionLinks(
  entry: KeywordEntry,
  existingSlugs: Set<string>,
  limit = 20
): RelatedLink[] {
  const related = getRelatedKeywordsFiltered(entry, existingSlugs, limit);
  return related.map((r) => ({
    href: `/zh/search/${r.slug}`,
    label: r.keyword
  }));
}

/** For ZhKeywordPageTemplate: answer index (more about topic) */
export function getAnswerIndexLinks(
  entry: KeywordEntry,
  existingSlugs: Set<string>,
  limit = 20
): RelatedLink[] {
  return getRelatedQuestionLinks(entry, existingSlugs, limit);
}

/** Ensure page has 5 keyword + 3 how-to + 3 tool links. Augment existing internal links. */
export function getMinimalInternalLinks(
  entry: KeywordEntry,
  existingSlugs: Set<string>,
  pageType?: "keyword" | "guide"
): RelatedLink[] {
  const keywordLinks = getRelatedQuestionLinks(entry, existingSlugs, 5);
  const howToLinks: RelatedLink[] = [
    { href: "/zh/how-to/grow-on-tiktok", label: "TikTok 涨粉指南" },
    { href: "/zh/how-to/get-youtube-subscribers", label: "YouTube 涨粉指南" },
    { href: "/zh/how-to/go-viral-on-instagram", label: "Instagram 涨粉指南" }
  ];
  const toolLinks: RelatedLink[] = [
    { href: "/zh/tools/tiktok-caption-generator", label: "TikTok 文案生成器" },
    { href: "/zh/tools/hook-generator", label: "钩子生成器" },
    { href: "/zh/tools/title-generator", label: "标题生成器" }
  ];
  return [...keywordLinks, ...howToLinks, ...toolLinks];
}

/** For EnHowToPageTemplate: related EN + zh links */
export function getEnRelatedLinks(
  slug: string,
  title: string,
  limit = 20
): RelatedLink[] {
  const links: RelatedLink[] = [];
  const { getAllEnHowToSlugs, getEnHowToContent } = require("./en-how-to-content");
  const enSlugs = getAllEnHowToSlugs();
  for (const s of enSlugs) {
    if (s === slug) continue;
    const content = getEnHowToContent(s);
    if (content) links.push({ href: `/en/how-to/${s}`, label: content.title });
    if (links.length >= limit) break;
  }
  links.push({ href: "/zh/how-to/grow-on-tiktok", label: "TikTok 涨粉指南 (中文)" });
  links.push({ href: "/questions/tiktok", label: "TikTok Questions Hub" });
  links.push({ href: "/ai-feed", label: "AI Feed" });
  return links.slice(0, limit);
}
