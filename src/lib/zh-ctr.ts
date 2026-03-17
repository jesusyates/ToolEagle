/**
 * v58 CTR Optimization System - Title, description, featured snippet, FAQ schema
 */

import type { GuidePageType } from "@/config/traffic-topics";
import { formatTopicLabel, parseZhSlug, extractPlatformFromTopic } from "@/config/traffic-topics";
import { getZhInternalLinks } from "./generate-zh-content";
import { ZH_BASE_PATHS, getHubInternalLinks } from "./zh-hub-data";
import type { ZhPageContent } from "./generate-zh-content";

const POWER_WORDS = ["最新", "完整", "必读", "实战", "有效", "干货"];
const NUMBERS_BY_TYPE: Record<GuidePageType, { n: number; unit: string }> = {
  "how-to": { n: 7, unit: "个方法" },
  "ai-prompts": { n: 50, unit: "个提示词" },
  "content-strategy": { n: 5, unit: "个策略" },
  "viral-examples": { n: 10, unit: "个案例" }
};

/** CTR-optimized title: year, numbers, power words. */
export function getZhCtrTitle(
  content: ZhPageContent | null,
  pageType: GuidePageType,
  topic: string
): string {
  const { baseTopic } = parseZhSlug(topic);
  const topicLabel = formatTopicLabel(baseTopic).replace(/\s/g, "");
  const { n, unit } = NUMBERS_BY_TYPE[pageType];

  const typeLabels: Record<GuidePageType, string> = {
    "how-to": "涨粉",
    "ai-prompts": "AI 提示词",
    "content-strategy": "内容策略",
    "viral-examples": "爆款案例"
  };
  const core = typeLabels[pageType];

  if (pageType === "how-to") {
    const platform = extractPlatformFromTopic(topic);
    const pMap: Record<string, string> = { tiktok: "TikTok", youtube: "YouTube", instagram: "Instagram" };
    const pName = platform !== "general" ? pMap[platform] ?? "" : "";
    const subject = pName || topicLabel;
    return `${subject}${core}的${n}${unit}（2026最新完整指南）`;
  }

  return `${topicLabel}${core}${n}${unit}（2026最新完整指南）`;
}

/** Generate 2-3 title variations for A/B testing. */
export function getZhTitleVariations(
  content: ZhPageContent | null,
  pageType: GuidePageType,
  topic: string
): string[] {
  const primary = getZhCtrTitle(content, pageType, topic);
  const { baseTopic } = parseZhSlug(topic);
  const topicLabel = formatTopicLabel(baseTopic).replace(/\s/g, "");
  const variations: string[] = [primary];

  const { n } = NUMBERS_BY_TYPE[pageType];
  const platform = extractPlatformFromTopic(topic);
  const pMap: Record<string, string> = { tiktok: "TikTok", youtube: "YouTube", instagram: "Instagram" };
  const pName = platform !== "general" ? pMap[platform] ?? "" : topicLabel;

  if (pageType === "how-to" && pName) {
    variations.push(`${pName}涨粉必读：${n}个方法让你快速起号（2026）`);
    variations.push(`${n}个${pName}涨粉技巧，新手也能轻松上手`);
  } else {
    variations.push(`${topicLabel}${n}个实用技巧（2026必读指南）`);
  }

  return [...new Set(variations)].slice(0, 3);
}

/** CTR-optimized meta description: hook, benefit, keywords. */
export function getZhCtrDescription(
  content: ZhPageContent | null,
  pageType: GuidePageType,
  topic: string
): string {
  const { baseTopic } = parseZhSlug(topic);
  const topicLabel = formatTopicLabel(baseTopic).replace(/-/g, " ");
  const { n } = NUMBERS_BY_TYPE[pageType];

  const hooks: Record<GuidePageType, string> = {
    "how-to": "想在",
    "ai-prompts": "需要",
    "content-strategy": "想做好",
    "viral-examples": "想学"
  };
  const hook = hooks[pageType];
  const benefit = "适合新手和进阶创作者，附带实操技巧";

  return `${hook} ${topicLabel}？本文整理了${n}个最有效的方法，${benefit}。`;
}

/** Featured snippet question from topic. */
export function getZhFeaturedQuestion(pageType: GuidePageType, topic: string): string {
  const { baseTopic } = parseZhSlug(topic);
  const topicLabel = formatTopicLabel(baseTopic).replace(/-/g, " ");

  const qTemplates: Record<GuidePageType, string> = {
    "how-to": `如何${topicLabel}？`,
    "ai-prompts": `${topicLabel} AI 提示词怎么用？`,
    "content-strategy": `${topicLabel} 内容策略怎么做？`,
    "viral-examples": `${topicLabel} 爆款案例有哪些？`
  };
  return qTemplates[pageType];
}

/** Parse FAQ from content into { question, answer }[]. */
export function parseZhFaqForSchema(faq: string): { question: string; answer: string }[] {
  if (!faq?.trim()) return [];
  const items: { question: string; answer: string }[] = [];
  const blocks = faq.split(/(?=### Q\d|### Q\s)/i).filter((b) => /Q\d/i.test(b));

  for (const block of blocks) {
    const qMatch = block.match(/Q\d?\s*[：:]\s*(.+?)(?=\n|$)/);
    const aMatch = block.match(/A\d?\s*[：:]\s*([\s\S]+?)(?=### Q|$)/i);
    if (qMatch && aMatch) {
      items.push({
        question: qMatch[1].trim(),
        answer: aMatch[1].trim().replace(/\n+/g, " ").slice(0, 500)
      });
    }
  }
  return items.slice(0, 3);
}

/** Build FAQPage JSON-LD schema. */
export function buildZhFaqSchema(
  faqItems: { question: string; answer: string }[],
  _pageUrl?: string
): object {
  if (faqItems.length === 0) return {};
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer
      }
    }))
  };
}

/** Curiosity-driven titles for "你可能还想看". */
export function getZhCuriosityLinks(
  pageType: GuidePageType,
  topic: string,
  count = 6
): { href: string; label: string }[] {
  const links = getZhInternalLinks(pageType, topic);

  const curiositySuffixes: Record<string, string> = {
    "涨粉": "→ 很多人不知道的秘诀",
    "AI 提示词": "→ 让内容爆的提示词",
    "内容策略": "→ 流量翻倍的做法",
    "爆款案例": "→ 值得抄的案例"
  };

  return links.slice(0, count).map((link) => {
    const key = Object.keys(curiositySuffixes).find((k) => link.label.includes(k));
    const suffix = key ? curiositySuffixes[key] : "";
    const label = suffix ? `${link.label} ${suffix}` : link.label;
    return { href: link.href, label };
  });
}

/** Curiosity links for hub pages (uses hub internal links). */
export function getZhHubCuriosityLinks(
  pageType: GuidePageType,
  platform: string,
  count = 6
): { href: string; label: string }[] {
  const links = getHubInternalLinks(pageType, platform as import("@/config/traffic-topics").ZhPlatform);
  return links.slice(0, count).map((l) => ({ href: l.href, label: l.label }));
}
