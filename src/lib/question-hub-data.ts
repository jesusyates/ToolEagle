/**
 * V79: Question hub data - 50-200 question links per platform.
 * Grouped by intent: how-to, monetization, beginner, results.
 */

import { getAllKeywordSlugsWithContent } from "./zh-keyword-content";
import { getKeywordBySlug } from "./keyword-patterns";
import { getAllEnHowToSlugs, getEnHowToContent } from "./en-how-to-content";
import type { KeywordPlatform } from "./keyword-patterns";

export type QuestionLink = {
  href: string;
  label: string;
  intent: "how-to" | "monetization" | "beginner" | "results";
  lang: "zh" | "en";
};

const INTENT_MAP_ZH: Record<string, QuestionLink["intent"]> = {
  涨粉: "how-to",
  获得播放量: "results",
  做爆款视频: "results",
  提高互动率: "how-to",
  账号起号: "beginner",
  变现: "monetization",
  做爆款: "results",
  引流: "how-to",
  做内容: "how-to",
  提高完播率: "how-to",
  直播带货: "monetization",
  私域引流: "monetization",
  品牌打造: "how-to",
  算法优化: "how-to",
  数据分析: "results"
};

function inferIntentZh(goal: string, keyword: string): QuestionLink["intent"] {
  if (INTENT_MAP_ZH[goal]) return INTENT_MAP_ZH[goal];
  if (/变现|赚钱|带货|引流/.test(keyword)) return "monetization";
  if (/新手|入门|起号/.test(keyword)) return "beginner";
  if (/涨粉|播放量|爆款/.test(keyword)) return "results";
  return "how-to";
}

function inferIntentEn(slug: string): QuestionLink["intent"] {
  if (/monetization|monetize|money|earn|brand|affiliate/.test(slug)) return "monetization";
  if (/beginner|for-beginners/.test(slug)) return "beginner";
  if (/growth|grow|views|viral/.test(slug)) return "results";
  return "how-to";
}

export function getQuestionLinksByPlatform(platform: KeywordPlatform): QuestionLink[] {
  const links: QuestionLink[] = [];
  const keywordSlugs = getAllKeywordSlugsWithContent();

  for (const slug of keywordSlugs) {
    const entry = getKeywordBySlug(slug);
    if (!entry || entry.platform !== platform) continue;
    links.push({
      href: `/zh/search/${slug}`,
      label: entry.keyword,
      intent: inferIntentZh(entry.goal, entry.keyword),
      lang: "zh"
    });
  }

  const enSlugs = getAllEnHowToSlugs();
  for (const slug of enSlugs) {
    const content = getEnHowToContent(slug);
    if (!content) continue;
    if (!slug.includes(platform)) continue;
    links.push({
      href: `/en/how-to/${slug}`,
      label: content.title,
      intent: inferIntentEn(slug),
      lang: "en"
    });
  }

  const byIntent: Record<QuestionLink["intent"], QuestionLink[]> = {
    "how-to": [],
    monetization: [],
    beginner: [],
    results: []
  };
  for (const link of links) {
    byIntent[link.intent].push(link);
  }

  return [
    ...byIntent["how-to"],
    ...byIntent["monetization"],
    ...byIntent["beginner"],
    ...byIntent["results"]
  ].slice(0, 200);
}
