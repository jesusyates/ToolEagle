/**
 * v56 SEO Authority Structure - Hub page data
 * Platform hub pages: /zh/how-to/[platform], etc.
 */

import type { GuidePageType } from "@/config/traffic-topics";
import {
  extractPlatformFromTopic,
  ZH_PLATFORMS,
  type ZhPlatform,
  parseZhSlug,
  formatTopicLabel
} from "@/config/traffic-topics";
import { getZhContent, getAllZhGuideParams } from "./generate-zh-content";

const ZH_BASE_PATHS: Record<GuidePageType, string> = {
  "how-to": "/zh/how-to",
  "ai-prompts": "/zh/ai-prompts-for",
  "content-strategy": "/zh/content-strategy",
  "viral-examples": "/zh/viral-examples"
};

const PLATFORM_NAMES: Record<ZhPlatform, string> = {
  tiktok: "TikTok",
  youtube: "YouTube",
  instagram: "Instagram"
};

const HUB_OVERVIEWS: Record<ZhPlatform, Record<GuidePageType, string>> = {
  tiktok: {
    "how-to": "TikTok 涨粉与创作完整指南合集。涵盖算法理解、发布策略、钩子技巧、文案标签、变现方法等，助你在 TikTok 快速成长。",
    "ai-prompts": "TikTok 创作者 AI 提示词合集。涵盖各垂类优质提示词，可直接复制到 ChatGPT 或免费 AI 工具使用。",
    "content-strategy": "TikTok 创作者内容策略合集。涵盖定位、内容支柱、发布节奏、增长技巧，适合各垂类创作者。",
    "viral-examples": "TikTok 爆款案例合集。精选各领域爆款文案与钩子，可复制学习或作为灵感参考。"
  },
  youtube: {
    "how-to": "YouTube 涨粉与创作完整指南合集。涵盖订阅增长、Shorts 策略、标题优化、算法理解等，助你在 YouTube 持续成长。",
    "ai-prompts": "YouTube 创作者 AI 提示词合集。涵盖标题、描述、脚本等场景的优质提示词。",
    "content-strategy": "YouTube 创作者内容策略合集。涵盖定位、内容支柱、发布节奏、增长技巧。",
    "viral-examples": "YouTube 爆款案例合集。精选各领域爆款标题与钩子。"
  },
  instagram: {
    "how-to": "Instagram 涨粉与创作完整指南合集。涵盖 Reels 策略、涨粉技巧、文案标签、算法理解等。",
    "ai-prompts": "Instagram 创作者 AI 提示词合集。涵盖 Reels、图文等场景的优质提示词。",
    "content-strategy": "Instagram 创作者内容策略合集。涵盖定位、内容支柱、发布节奏、增长技巧。",
    "viral-examples": "Instagram 爆款案例合集。精选各领域爆款文案与钩子。"
  }
};

function getHubSectionLabel(pageType: GuidePageType): string {
  const names: Record<GuidePageType, string> = {
    "how-to": "涨粉指南",
    "ai-prompts": "AI 提示词",
    "content-strategy": "内容策略",
    "viral-examples": "爆款案例"
  };
  return names[pageType];
}

const MOD_LABELS: Record<string, string> = {
  fast: "快速",
  beginners: "新手",
  "2026": "2026",
  strategy: "策略",
  tips: "技巧"
};

/** Get child topics for a hub. For how-to: filter by platform. For others: all topics. */
export function getHubChildTopics(pageType: GuidePageType, platform: ZhPlatform): { topic: string; label: string }[] {
  const allParams = getAllZhGuideParams();
  const filtered =
    pageType === "how-to"
      ? allParams.filter((p) => p.pageType === pageType && (extractPlatformFromTopic(p.topic) === platform || extractPlatformFromTopic(p.topic) === "general"))
      : allParams.filter((p) => p.pageType === pageType);

  return filtered
    .filter((p) => getZhContent(pageType, p.topic))
    .map((p) => {
      const { baseTopic, modifier } = parseZhSlug(p.topic);
      const label = formatTopicLabel(baseTopic).replace(/-/g, " ");
      const modSuffix = modifier ? `（${MOD_LABELS[modifier] ?? modifier}）` : "";
      return { topic: p.topic, label: label + modSuffix };
    });
}

/** Get all hub internal links (20-50). */
export function getHubInternalLinks(pageType: GuidePageType, platform: ZhPlatform): { href: string; label: string }[] {
  const links: { href: string; label: string }[] = [];
  const pName = PLATFORM_NAMES[platform];

  const children = getHubChildTopics(pageType, platform);
  children.forEach((c) => {
    links.push({ href: `${ZH_BASE_PATHS[pageType]}/${c.topic}`, label: c.label });
  });

  for (const pt of ["how-to", "ai-prompts", "content-strategy", "viral-examples"] as GuidePageType[]) {
    if (pt !== pageType) {
      links.push({
        href: `${ZH_BASE_PATHS[pt]}/${platform}`,
        label: `${pName} ${getHubSectionLabel(pt)}合集`
      });
    }
  }

  for (const p of ZH_PLATFORMS) {
    if (p !== platform) {
      links.push({
        href: `${ZH_BASE_PATHS[pageType]}/${p}`,
        label: `${PLATFORM_NAMES[p]} ${getHubSectionLabel(pageType)}合集`
      });
    }
  }

  links.push({ href: "/tools", label: "免费 AI 工具" });
  links.push({ href: "/blog", label: "创作者指南" });
  links.push({ href: "/zh/how-to/tiktok", label: "TikTok 涨粉指南合集" });
  links.push({ href: "/zh/how-to/youtube", label: "YouTube 涨粉指南合集" });
  links.push({ href: "/zh/how-to/instagram", label: "Instagram 涨粉指南合集" });

  return links.slice(0, 50);
}

export function getHubOverview(pageType: GuidePageType, platform: ZhPlatform): string {
  return HUB_OVERVIEWS[platform]?.[pageType] ?? `${PLATFORM_NAMES[platform]} 创作者指南合集`;
}

export function getAllHubParams(): { pageType: GuidePageType; platform: ZhPlatform }[] {
  const params: { pageType: GuidePageType; platform: ZhPlatform }[] = [];
  for (const pageType of ["how-to", "ai-prompts", "content-strategy", "viral-examples"] as GuidePageType[]) {
    for (const platform of ZH_PLATFORMS) {
      params.push({ pageType, platform });
    }
  }
  return params;
}

export { ZH_BASE_PATHS, PLATFORM_NAMES };
