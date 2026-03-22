/**
 * V79: AI-friendly sitemap data.
 * zh/search, en/how-to, high-intent (赚钱/monetization/growth).
 */

import { BASE_URL } from "@/config/site";
import { getAllKeywordSlugsWithContent } from "./zh-keyword-content";
import { getKeywordLastModifiedMap } from "./zh-keyword-data";
import { getKeywordBySlug } from "./keyword-patterns";
import { getAllEnHowToSlugs } from "./en-how-to-content";
import { getZhContent, getAllZhGuideParams } from "./generate-zh-content";
import { getAllHubParams, ZH_BASE_PATHS } from "./zh-hub-data";

export type AiSitemapEntry = {
  url: string;
  lastmod: string;
  changefreq: string;
  priority: number;
};

const HIGH_INTENT_ZH = /涨粉|变现|引流|赚钱| monetization|growth/i;

function isHighIntentZh(keyword: string, goal?: string): boolean {
  return HIGH_INTENT_ZH.test(keyword || "") || /涨粉|变现|引流/.test(goal || "");
}

function isHighIntentEn(slug: string): boolean {
  return /monetization|growth|grow|money|earn/.test(slug);
}

/** sitemap-ai.xml: ALL zh/search + ALL en/how-to, priority higher for high-intent */
export function getAiSitemapUrls(): AiSitemapEntry[] {
  const now = new Date().toISOString().split("T")[0];
  const lastModMap = getKeywordLastModifiedMap();
  const entries: AiSitemapEntry[] = [];

  const keywordSlugs = getAllKeywordSlugsWithContent();
  for (const slug of keywordSlugs) {
    const entry = getKeywordBySlug(slug);
    const priority = entry && isHighIntentZh(entry.keyword, entry.goal) ? 0.95 : 0.9;
    entries.push({
      url: `${BASE_URL}/zh/search/${slug}`,
      lastmod: new Date(lastModMap[slug] ?? Date.now()).toISOString().split("T")[0],
      changefreq: "daily",
      priority
    });
  }

  for (const slug of getAllEnHowToSlugs()) {
    const priority = isHighIntentEn(slug) ? 0.95 : 0.9;
    entries.push({
      url: `${BASE_URL}/en/how-to/${slug}`,
      lastmod: now,
      changefreq: "daily",
      priority
    });
  }

  entries.push(
    { url: `${BASE_URL}/ai-feed`, lastmod: now, changefreq: "daily", priority: 0.95 },
    { url: `${BASE_URL}/questions/tiktok`, lastmod: now, changefreq: "daily", priority: 0.95 },
    { url: `${BASE_URL}/questions/youtube`, lastmod: now, changefreq: "daily", priority: 0.95 },
    { url: `${BASE_URL}/questions/instagram`, lastmod: now, changefreq: "daily", priority: 0.95 }
  );

  return entries;
}

/** sitemap-en.xml: ALL en/how-to pages */
export function getEnSitemapUrls(): AiSitemapEntry[] {
  const now = new Date().toISOString().split("T")[0];
  return getAllEnHowToSlugs().map((slug) => ({
    url: `${BASE_URL}/en/how-to/${slug}`,
    lastmod: now,
    changefreq: "daily",
    priority: 0.85
  }));
}

/** sitemap-questions.xml: question-style pages, higher priority */
export function getQuestionsSitemapUrls(): AiSitemapEntry[] {
  const now = new Date().toISOString().split("T")[0];
  const lastModMap = getKeywordLastModifiedMap();
  const entries: AiSitemapEntry[] = [];

  const keywordSlugs = getAllKeywordSlugsWithContent();
  for (const slug of keywordSlugs) {
    const entry = getKeywordBySlug(slug);
    if (!entry) continue;
    const isQuestion = /怎么做|需要多久|靠谱吗|能赚钱吗|新手怎么/.test(entry.keyword || "");
    entries.push({
      url: `${BASE_URL}/zh/search/${slug}`,
      lastmod: new Date(lastModMap[slug] ?? Date.now()).toISOString().split("T")[0],
      changefreq: "daily",
      priority: isQuestion ? 0.95 : 0.85
    });
  }

  const params = getAllZhGuideParams();
  for (const { pageType, topic } of params) {
    if (!getZhContent(pageType, topic)) continue;
    entries.push({
      url: `${BASE_URL}${ZH_BASE_PATHS[pageType]}/${topic}`,
      lastmod: now,
      changefreq: "daily",
      priority: 0.9
    });
  }

  const hubParams = getAllHubParams();
  for (const { pageType, platform } of hubParams) {
    entries.push({
      url: `${BASE_URL}${ZH_BASE_PATHS[pageType]}/${platform}`,
      lastmod: now,
      changefreq: "daily",
      priority: 0.9
    });
  }

  for (const slug of getAllEnHowToSlugs()) {
    entries.push({
      url: `${BASE_URL}/en/how-to/${slug}`,
      lastmod: now,
      changefreq: "daily",
      priority: 0.9
    });
  }

  entries.push(
    { url: `${BASE_URL}/questions/tiktok`, lastmod: now, changefreq: "daily", priority: 0.95 },
    { url: `${BASE_URL}/questions/youtube`, lastmod: now, changefreq: "daily", priority: 0.95 },
    { url: `${BASE_URL}/questions/instagram`, lastmod: now, changefreq: "daily", priority: 0.95 },
    { url: `${BASE_URL}/ai-feed`, lastmod: now, changefreq: "daily", priority: 0.95 }
  );

  return entries;
}

function toXml(entries: AiSitemapEntry[]): string {
  const urlEntries = entries
    .map(
      (e) =>
        `  <url>
    <loc>${e.url}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

export function aiSitemapToXml(entries: AiSitemapEntry[]): string {
  return toXml(entries);
}
