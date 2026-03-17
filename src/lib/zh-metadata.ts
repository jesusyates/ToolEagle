/**
 * zh page metadata - unified title, description, OG format
 * Format: {keyword}（2026最新指南） | ToolEagle
 * Description: 想了解{keyword}？本文提供完整方法、技巧和实操指南，适合新手和进阶用户。
 */

import type { GuidePageType } from "@/config/traffic-topics";
import { formatTopicLabel, parseZhSlug, extractPlatformFromTopic } from "@/config/traffic-topics";
import { BASE_URL } from "@/config/site";

export const ZH_DEFAULT_OG_IMAGE = `${BASE_URL}/og/zh-default`;

export function getZhPageTitle(keyword: string): string {
  return `${keyword}（2026最新指南） | ToolEagle`;
}

export function getZhPageDescription(keyword: string): string {
  return `想了解${keyword}？本文提供完整方法、技巧和实操指南，适合新手和进阶用户。`;
}

/** Get keyword label for guide pages (how-to, ai-prompts, content-strategy, viral-examples) */
export function getZhGuideKeyword(pageType: GuidePageType, topic: string): string {
  const { baseTopic } = parseZhSlug(topic);
  const topicLabel = formatTopicLabel(baseTopic).replace(/\s/g, "");
  const pMap: Record<string, string> = { tiktok: "TikTok", youtube: "YouTube", instagram: "Instagram" };
  const platform = extractPlatformFromTopic(topic);
  const pName = platform !== "general" ? pMap[platform] ?? "" : "";

  switch (pageType) {
    case "how-to":
      return pName ? `${pName} 涨粉` : `${topicLabel} 涨粉`;
    case "ai-prompts":
      return `${topicLabel} AI 提示词`;
    case "content-strategy":
      return `${topicLabel} 内容策略`;
    case "viral-examples":
      return `${topicLabel} 爆款案例`;
    default:
      return topicLabel;
  }
}

/** v61: Use custom title/description when provided (from CTR-optimized content) */
/** v66: ogImage - keyword-specific OG image URL */
export function getZhPageMetadata(
  keyword: string,
  url: string,
  noindex?: boolean,
  overrides?: { title?: string; description?: string; ogImage?: string }
) {
  const title = overrides?.title ?? getZhPageTitle(keyword);
  const description = overrides?.description ?? getZhPageDescription(keyword);
  const ogImage = overrides?.ogImage ?? ZH_DEFAULT_OG_IMAGE;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      siteName: "ToolEagle",
      type: "article" as const
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description
    },
    ...(noindex && { robots: { index: false, follow: true } })
  };
}
