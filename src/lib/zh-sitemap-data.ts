/**
 * v57 Indexing & Crawl Acceleration - HTML sitemap & recent pages data
 */

import * as fs from "fs";
import * as path from "path";
import type { GuidePageType } from "@/config/traffic-topics";
import { extractPlatformFromTopic, ZH_PLATFORMS, type ZhPlatform } from "@/config/traffic-topics";
import { getZhContent, getAllZhGuideParams } from "./generate-zh-content";
import { getAllHubParams, ZH_BASE_PATHS, PLATFORM_NAMES } from "./zh-hub-data";

const PAGE_TYPE_LABELS: Record<GuidePageType, string> = {
  "how-to": "涨粉指南",
  "ai-prompts": "AI 提示词",
  "content-strategy": "内容策略",
  "viral-examples": "爆款案例"
};

export type ZhSitemapEntry = {
  href: string;
  label: string;
  pageType: GuidePageType;
  topic: string;
  platform: ZhPlatform | "general";
};

/** All zh pages with content (child + hub), for HTML sitemap. */
export function getAllZhSitemapEntries(): ZhSitemapEntry[] {
  const entries: ZhSitemapEntry[] = [];

  // Hub pages
  for (const { pageType, platform } of getAllHubParams()) {
    entries.push({
      href: `${ZH_BASE_PATHS[pageType]}/${platform}`,
      label: `${PLATFORM_NAMES[platform]} ${PAGE_TYPE_LABELS[pageType]}合集`,
      pageType,
      topic: platform,
      platform
    });
  }

  // Child pages
  const params = getAllZhGuideParams();
  for (const { pageType, topic } of params) {
    if (!getZhContent(pageType, topic)) continue;
    const platform = extractPlatformFromTopic(topic);
    const basePath = ZH_BASE_PATHS[pageType];
    const label = topic.replace(/-/g, " ");
    entries.push({
      href: `${basePath}/${topic}`,
      label,
      pageType,
      topic,
      platform: platform === "general" ? "general" : platform
    });
  }

  return entries;
}

/** Group entries by platform for sitemap display. */
export function getZhSitemapByPlatform(
  pageType?: GuidePageType
): Record<ZhPlatform | "general", ZhSitemapEntry[]> {
  const all = getAllZhSitemapEntries();
  const filtered = pageType ? all.filter((e) => e.pageType === pageType) : all;

  const byPlatform: Record<ZhPlatform | "general", ZhSitemapEntry[]> = {
    tiktok: [],
    youtube: [],
    instagram: [],
    general: []
  };

  for (const e of filtered) {
    byPlatform[e.platform].push(e);
  }

  return byPlatform;
}

/** Recent 50-100 pages. Uses lastModified if available, else stable sort. */
export function getRecentZhPages(limit = 80): ZhSitemapEntry[] {
  const cache = loadZhCacheWithMeta();
  const entries: { entry: ZhSitemapEntry; ts: number }[] = [];

  for (const [pageType, topics] of Object.entries(cache)) {
    if (typeof topics !== "object") continue;
    for (const [topic, data] of Object.entries(topics as Record<string, { lastModified?: number }>)) {
      const ts = (data as { lastModified?: number })?.lastModified ?? 0;
      const platform = extractPlatformFromTopic(topic);
      entries.push({
        entry: {
          href: `${ZH_BASE_PATHS[pageType as GuidePageType]}/${topic}`,
          label: topic.replace(/-/g, " "),
          pageType: pageType as GuidePageType,
          topic,
          platform: platform === "general" ? "general" : platform
        },
        ts
      });
    }
  }

  return entries
    .sort((a, b) => (b.ts !== a.ts ? b.ts - a.ts : a.entry.href.localeCompare(b.entry.href)))
    .slice(0, limit)
    .map((x) => x.entry);
}

/** Load raw cache to read lastModified. */
function loadZhCacheWithMeta(): Record<string, Record<string, unknown>> {
  try {
    const p = path.join(process.cwd(), "data", "zh-seo.json");
    const raw = fs.readFileSync(p, "utf8");
    return JSON.parse(raw) as Record<string, Record<string, unknown>>;
  } catch {
    return {};
  }
}

/** Top 10 zh topics for footer (popular pages with content). */
export function getTopZhTopics(limit = 10): { href: string; label: string }[] {
  const priority = [
    "grow-on-tiktok",
    "get-youtube-subscribers",
    "get-instagram-followers",
    "write-viral-captions",
    "create-viral-hooks",
    "tiktok",
    "youtube",
    "instagram",
    "grow-on-youtube-shorts",
    "monetize-tiktok"
  ];
  const entries = getAllZhSitemapEntries().filter((e) => e.platform !== "general" || priority.some((p) => e.topic.startsWith(p)));
  const seen = new Set<string>();
  const result: { href: string; label: string }[] = [];
  for (const p of priority) {
    const match = entries.find((e) => (e.topic === p || e.topic.startsWith(p + "-")) && !seen.has(e.href));
    if (match) {
      seen.add(match.href);
      result.push({ href: match.href, label: match.label });
    }
  }
  for (const e of entries) {
    if (result.length >= limit) break;
    if (!seen.has(e.href)) {
      result.push({ href: e.href, label: e.label });
    }
  }
  return result.slice(0, limit);
}

/** 5-10 recent pages for "最新发布" section. */
export function getRecentZhLinks(count = 8): { href: string; label: string }[] {
  return getRecentZhPages(count).map((e) => ({ href: e.href, label: e.label }));
}

/** v62: Recent pages including keyword pages, sorted by createdAt DESC */
export type RecentZhPageWithMeta = { href: string; label: string; createdAt: number };
export function getRecentZhPagesWithKeywords(limit = 100): RecentZhPageWithMeta[] {
  const guideEntries = getRecentZhPagesWithMeta();
  const keywordEntries = getRecentKeywordPagesWithMeta();
  const combined = [...keywordEntries, ...guideEntries].filter((e) => !isEnglishBrandZhGuidePath(e.href));
  return combined
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, limit);
}

/** 英文品牌向 /zh/how-to 等集群：不在中文站「最新」列表展示（主路径为抖音专栏）。 */
function isEnglishBrandZhGuidePath(href: string): boolean {
  return (
    href.startsWith("/zh/how-to/") ||
    href.startsWith("/zh/ai-prompts-for/") ||
    href.startsWith("/zh/content-strategy/") ||
    href.startsWith("/zh/viral-examples/")
  );
}

function getRecentZhPagesWithMeta(): RecentZhPageWithMeta[] {
  const cache = loadZhCacheWithMeta();
  const entries: RecentZhPageWithMeta[] = [];
  for (const [pageType, topics] of Object.entries(cache)) {
    if (typeof topics !== "object") continue;
    for (const [topic, data] of Object.entries(topics as Record<string, { lastModified?: number }>)) {
      const ts = (data as { lastModified?: number })?.lastModified ?? 0;
      entries.push({
        href: `${ZH_BASE_PATHS[pageType as GuidePageType]}/${topic}`,
        label: topic.replace(/-/g, " "),
        createdAt: ts
      });
    }
  }
  return entries;
}

function getRecentKeywordPagesWithMeta(): RecentZhPageWithMeta[] {
  const { getLatestKeywordPages } = require("./zh-keyword-data");
  return getLatestKeywordPages(200).map((e: { slug: string; keyword: string; createdAt: number }) => ({
    href: `/zh/search/${e.slug}`,
    label: e.keyword,
    createdAt: e.createdAt
  }));
}
