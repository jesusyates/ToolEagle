/**
 * v55 Chinese SEO Scaling Engine
 * Content: directAnswer, stepByStep, FAQ, tips, internal links.
 * 8–15 internal links per page.
 */

import type { GuidePageType } from "@/config/traffic-topics";
import {
  formatTopicLabel,
  parseZhSlug,
  isBaseTopicValid,
  ZH_TOPIC_MODIFIERS,
  getBaseTopicSlugs,
  GUIDE_PAGE_CONFIG,
  extractPlatformFromTopic,
  ZH_PLATFORMS
} from "@/config/traffic-topics";
import { getAllGuideParams, getAllPromptTopicSlugs } from "@/config/traffic-topics";
import * as fs from "fs";
import * as path from "path";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export type ZhPageContent = {
  title: string;
  description: string;
  h1: string;
  directAnswer: string; // 40–80 chars
  intro: string;
  guide: string;
  stepByStep: string;
  faq: string; // 3 questions
  strategy: string;
  tips: string;
  internalLinks?: string[]; // optional, we auto-generate 8–15
  titleVariations?: string[]; // v58: 2-3 alt titles for A/B testing
  published?: boolean; // v59: false = hidden, undefined/true = live
};

const CACHE_PATH = path.join(process.cwd(), "data", "zh-seo.json");

function getPageTypeLabel(pageType: GuidePageType, topicLabel: string): string {
  switch (pageType) {
    case "how-to":
      return `如何${topicLabel}`;
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

const MODIFIER_LABELS: Record<string, string> = {
  fast: "快速",
  beginners: "新手",
  "2026": "2026",
  strategy: "策略",
  tips: "技巧"
};

function buildGenerationPrompt(pageType: GuidePageType, topic: string): string {
  const { baseTopic, modifier } = parseZhSlug(topic);
  const topicLabel = formatTopicLabel(baseTopic);
  const modLabel = modifier ? MODIFIER_LABELS[modifier] ?? modifier : "";
  const pageLabel = getPageTypeLabel(pageType, topicLabel) + (modLabel ? `（${modLabel}）` : "");

  const modifierFocus: Record<string, string> = {
    fast: "侧重快速见效、省时高效的方法",
    beginners: "侧重零基础、入门级、易懂易上手",
    "2026": "侧重 2026 年最新趋势和算法变化",
    strategy: "侧重长期策略和系统规划",
    tips: "侧重实用技巧和可立即执行的建议"
  };
  const focus = modifier ? modifierFocus[modifier] ?? "" : "";

  const instructions: Record<GuidePageType, string> = {
    "how-to": `写一篇关于「${topicLabel}」的完整指南${focus ? `，${focus}` : ""}。面向中文创作者，内容原创。必须包含：直接回答（40-80字）、分步骤指南、3个FAQ、技巧。总字数 1200-2000 字。`,
    "ai-prompts": `写一篇关于「${topicLabel}」的 AI 提示词指南${focus ? `，${focus}` : ""}。必须包含：直接回答（40-80字）、分步骤、3个FAQ、技巧。总字数 1200-2000 字。`,
    "content-strategy": `写一篇关于「${topicLabel}」的内容策略指南${focus ? `，${focus}` : ""}。必须包含：直接回答（40-80字）、分步骤、3个FAQ、技巧。总字数 1200-2000 字。`,
    "viral-examples": `写一篇关于「${topicLabel}」的爆款案例指南${focus ? `，${focus}` : ""}。必须包含：直接回答（40-80字）、分步骤、3个FAQ、技巧。总字数 1200-2000 字。`
  };

  return `你是一位资深中文内容创作者和 SEO 专家。用中文撰写，面向抖音、小红书、B站创作者。

主题：${topicLabel}${modLabel ? `（${modLabel}）` : ""}
页面类型：${pageLabel}

要求：${instructions[pageType]}
- Markdown 格式，## 和 ### 标题
- 内容原创，实用可操作

输出 JSON：
{
  "title": "SEO 标题",
  "description": "meta description，150字内",
  "h1": "页面主标题",
  "directAnswer": "直接回答，40-80字，一句话概括核心答案",
  "intro": "引言，2-3句",
  "guide": "指南正文 Markdown",
  "stepByStep": "分步骤指南 Markdown，如：第一步...第二步...",
  "faq": "3个FAQ，Markdown，格式：## 常见问题\\n### Q1...\\nA1...\\n### Q2...",
  "strategy": "策略部分 Markdown",
  "tips": "技巧部分 Markdown，1.2.3.列表"
}`;
}

export async function generateZhContentWithAI(
  pageType: GuidePageType,
  topic: string,
  apiKey: string
): Promise<ZhPageContent> {
  const prompt = buildGenerationPrompt(pageType, topic);

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Empty response from OpenAI");

  // Extract JSON from response (may be wrapped in ```json)
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, content];
  const jsonStr = jsonMatch[1]?.trim() ?? content;
  const parsed = JSON.parse(jsonStr) as ZhPageContent;

  const { baseTopic } = parseZhSlug(topic);
  const topicLabel = formatTopicLabel(baseTopic);

  return {
    title: parsed.title ?? getPageTypeLabel(pageType, topicLabel),
    description: parsed.description ?? "",
    h1: parsed.h1 ?? parsed.title ?? "",
    directAnswer: parsed.directAnswer ?? "",
    intro: parsed.intro ?? "",
    guide: parsed.guide ?? "",
    stepByStep: parsed.stepByStep ?? "",
    faq: parsed.faq ?? "",
    strategy: parsed.strategy ?? "",
    tips: parsed.tips ?? ""
  };
}

type ZhCache = Record<string, Record<string, ZhPageContent>>;

function loadCache(): ZhCache {
  try {
    const raw = fs.readFileSync(CACHE_PATH, "utf8");
    return JSON.parse(raw) as ZhCache;
  } catch {
    return {};
  }
}

function saveCache(cache: ZhCache): void {
  const dir = path.dirname(CACHE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), "utf8");
}

export function getZhContent(pageType: GuidePageType, topic: string): ZhPageContent | null {
  const cache = loadCache();
  const key = `${pageType}:${topic}`;
  const pageCache = cache[pageType] ?? cache[key];
  let content: ZhPageContent | undefined;
  if (typeof pageCache === "object" && topic in pageCache) {
    content = (pageCache as Record<string, ZhPageContent>)[topic];
  } else {
    const byType = cache[pageType];
    if (byType && typeof byType === "object" && topic in byType) {
      content = byType[topic];
    }
  }
  if (!content) return null;
  if (content.published === false) return null;
  return content;
}

export function setZhContent(pageType: GuidePageType, topic: string, content: ZhPageContent): void {
  const cache = loadCache();
  if (!cache[pageType]) cache[pageType] = {};
  (cache[pageType] as Record<string, ZhPageContent>)[topic] = content;
  saveCache(cache);
}

const ZH_BASE_PATHS: Record<GuidePageType, string> = {
  "how-to": "/zh/how-to",
  "ai-prompts": "/zh/ai-prompts-for",
  "content-strategy": "/zh/content-strategy",
  "viral-examples": "/zh/viral-examples"
};

/** Generate 8–15 internal links for a zh page. */
export function getZhInternalLinks(pageType: GuidePageType, topic: string): { href: string; label: string }[] {
  const { baseTopic } = parseZhSlug(topic);
  const allParams = getAllZhGuideParams();
  const links: { href: string; label: string }[] = [];
  const seen = new Set<string>();

  const add = (pt: GuidePageType, t: string, label: string) => {
    const key = `${pt}:${t}`;
    if (seen.has(key)) return;
    seen.add(key);
    links.push({ href: `${ZH_BASE_PATHS[pt]}/${t}`, label });
  };

  // Same page type, other topics/variants
  const sameType = allParams.filter((p) => p.pageType === pageType && p.topic !== topic);
  for (const { topic: t } of sameType.slice(0, 6)) {
    const { baseTopic: bt, modifier: mod } = parseZhSlug(t);
    const label = getPageTypeLabel(pageType, formatTopicLabel(bt)) + (mod ? `（${MODIFIER_LABELS[mod] ?? mod}）` : "");
    add(pageType, t, label);
  }

  // Same base topic, other page types
  const sameTopic = allParams.filter((p) => parseZhSlug(p.topic).baseTopic === baseTopic && (p.pageType !== pageType || p.topic !== topic));
  for (const { pageType: pt, topic: t } of sameTopic.slice(0, 4)) {
    add(pt, t, getPageTypeLabel(pt, formatTopicLabel(baseTopic)));
  }

  // Variants of same base
  for (const mod of ZH_TOPIC_MODIFIERS) {
    const variant = `${baseTopic}-${mod}`;
    if (variant !== topic) {
      add(pageType, variant, getPageTypeLabel(pageType, formatTopicLabel(baseTopic)) + `（${MODIFIER_LABELS[mod] ?? mod}）`);
    }
  }

  // Parent-child: link to hub page when platform is known
  const platform = extractPlatformFromTopic(topic);
  if (platform !== "general" && ZH_PLATFORMS.includes(platform)) {
    const hubHref = `${ZH_BASE_PATHS[pageType]}/${platform}`;
    const hubLabels: Record<GuidePageType, string> = {
      "how-to": "涨粉指南合集",
      "ai-prompts": "AI 提示词合集",
      "content-strategy": "内容策略合集",
      "viral-examples": "爆款案例合集"
    };
    const pNames: Record<string, string> = { tiktok: "TikTok", youtube: "YouTube", instagram: "Instagram" };
    const pName = pNames[platform] ?? platform;
    links.unshift({ href: hubHref, label: `${pName} ${hubLabels[pageType]}` });
  }

  // Global links
  add("how-to", "grow-on-tiktok", "TikTok 涨粉指南");
  links.push({ href: "/tools", label: "免费 AI 工具" });
  links.push({ href: "/blog", label: "创作者指南" });

  return links.slice(0, 15);
}

export function getAllZhGuideParams(): { pageType: GuidePageType; topic: string }[] {
  const params: { pageType: GuidePageType; topic: string }[] = [];

  for (const [pageType, config] of Object.entries(GUIDE_PAGE_CONFIG)) {
    for (const baseTopic of config.topics) {
      params.push({ pageType: pageType as GuidePageType, topic: baseTopic });
      for (const mod of ZH_TOPIC_MODIFIERS) {
        params.push({ pageType: pageType as GuidePageType, topic: `${baseTopic}-${mod}` });
      }
    }
  }

  return params.slice(0, 800);
}

/** Total zh pages with content. For reporting. */
export function getTotalZhPagesWithContent(): number {
  const params = getAllZhGuideParams();
  return params.filter(({ pageType, topic }) => getZhContent(pageType, topic)).length;
}

/** Internal links count per page (8–15). */
export const ZH_INTERNAL_LINKS_COUNT = { min: 8, max: 15 };

/** v57: Should add noindex for thin content (<800 chars or missing sections). */
export function shouldNoindexZhPage(content: ZhPageContent | null): boolean {
  if (!content) return true;
  const text = [
    content.intro,
    content.guide,
    content.stepByStep,
    content.faq,
    content.strategy,
    content.tips
  ]
    .filter(Boolean)
    .join("");
  if (text.length < 800) return true;
  const hasRequired = content.intro && (content.guide || content.stepByStep || content.faq);
  return !hasRequired;
}
