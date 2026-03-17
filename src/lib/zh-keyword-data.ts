/**
 * v62 Indexing Acceleration - Keyword page data for sitemaps, hubs, recommendations
 */

import * as fs from "fs";
import * as path from "path";
import { getKeywordBySlug } from "./keyword-patterns";
import type { KeywordEntry } from "./keyword-patterns";

export type ZhKeywordWithMeta = {
  slug: string;
  keyword: string;
  platform: string;
  goal: string;
  /** v63 */
  audience?: string;
  format?: string;
  time?: string;
  createdAt: number;
  lastModified: number;
};

const CACHE_PATH = path.join(process.cwd(), "data", "zh-keywords.json");

function loadKeywordCache(): Record<string, { keyword?: string; platform?: string; goal?: string; audience?: string; format?: string; time?: string; createdAt?: number; lastModified?: number; published?: boolean }> {
  try {
    const raw = fs.readFileSync(CACHE_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/** All keyword pages with content, with meta */
export function getAllKeywordPagesWithMeta(): ZhKeywordWithMeta[] {
  const cache = loadKeywordCache();
  const entries: ZhKeywordWithMeta[] = [];
  for (const [slug, data] of Object.entries(cache)) {
    if (data?.published === false) continue;
    const entry = getKeywordBySlug(slug);
    if (!entry) continue;
    entries.push({
      slug,
      keyword: data?.keyword ?? entry.keyword,
      platform: entry.platform,
      goal: entry.goal,
      audience: data?.audience ?? entry.audience,
      format: data?.format ?? entry.format,
      time: data?.time ?? entry.time,
      createdAt: data?.createdAt ?? 0,
      lastModified: data?.lastModified ?? 0
    });
  }
  return entries;
}

/** Latest N keyword pages by createdAt DESC */
export function getLatestKeywordPages(limit = 20): ZhKeywordWithMeta[] {
  return getAllKeywordPagesWithMeta()
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, limit);
}

/** Popular keywords: mix of goals (涨粉 first), then by recency */
const POPULAR_GOALS = ["涨粉", "变现", "做爆款", "引流", "做内容"];
export function getPopularKeywordPages(limit = 20): ZhKeywordWithMeta[] {
  const all = getAllKeywordPagesWithMeta();
  const byGoal = new Map<string, ZhKeywordWithMeta[]>();
  for (const g of POPULAR_GOALS) {
    byGoal.set(g, all.filter((e) => e.goal === g).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
  }
  const rest = all.filter((e) => !POPULAR_GOALS.includes(e.goal)).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const result: ZhKeywordWithMeta[] = [];
  let perGoal = Math.ceil(limit / (POPULAR_GOALS.length + 1));
  for (const g of POPULAR_GOALS) {
    result.push(...(byGoal.get(g) ?? []).slice(0, perGoal));
  }
  result.push(...rest.slice(0, perGoal));
  return result.slice(0, limit);
}

/** Keywords by platform, grouped by goal */
export function getKeywordsByPlatformGroupedByGoal(
  platform: "tiktok" | "youtube" | "instagram",
  limit = 100
): Record<string, ZhKeywordWithMeta[]> {
  const goals = ["涨粉", "变现", "做爆款", "引流", "做内容"];
  const all = getAllKeywordPagesWithMeta().filter((e) => e.platform === platform);
  const byGoal: Record<string, ZhKeywordWithMeta[]> = {};
  for (const g of goals) {
    byGoal[g] = all.filter((e) => e.goal === g).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }
  return byGoal;
}

/** v63: Keywords by platform, grouped by audience */
export function getKeywordsByPlatformGroupedByAudience(
  platform: "tiktok" | "youtube" | "instagram",
  limit = 100
): Record<string, ZhKeywordWithMeta[]> {
  const audiences = ["新手", "小白", "个人", "博主", "商家"];
  const all = getAllKeywordPagesWithMeta().filter((e) => e.platform === platform && e.audience);
  const byAudience: Record<string, ZhKeywordWithMeta[]> = {};
  for (const a of audiences) {
    byAudience[a] = all.filter((e) => e.audience === a).sort((x, y) => (y.createdAt || 0) - (x.createdAt || 0));
  }
  return byAudience;
}

/** v63: Keywords by platform, grouped by format */
export function getKeywordsByPlatformGroupedByFormat(
  platform: "tiktok" | "youtube" | "instagram",
  limit = 100
): Record<string, ZhKeywordWithMeta[]> {
  const formats = ["教程", "方法", "技巧", "指南", "模板"];
  const all = getAllKeywordPagesWithMeta().filter((e) => e.platform === platform && e.format);
  const byFormat: Record<string, ZhKeywordWithMeta[]> = {};
  for (const f of formats) {
    byFormat[f] = all.filter((e) => e.format === f).sort((x, y) => (y.createdAt || 0) - (x.createdAt || 0));
  }
  return byFormat;
}

/** For sitemap: slug -> lastModified */
export function getKeywordLastModifiedMap(): Record<string, number> {
  const cache = loadKeywordCache();
  const map: Record<string, number> = {};
  for (const [slug, data] of Object.entries(cache)) {
    if (data?.published === false) continue;
    map[slug] = data?.lastModified ?? data?.createdAt ?? Date.now();
  }
  return map;
}

/** Related recommendations: 10-15 links (same platform, goal, OR audience) */
export function getRelatedRecommendations(
  context?: { platform?: string; goal?: string; audience?: string; excludeSlug?: string },
  limit = 15
): { href: string; label: string }[] {
  const all = getAllKeywordPagesWithMeta();
  const seen = new Set<string>();
  const result: { href: string; label: string }[] = [];

  const add = (items: ZhKeywordWithMeta[], max: number) => {
    for (const e of items) {
      if (result.length >= limit) return;
      if (e.slug === context?.excludeSlug || seen.has(e.slug)) continue;
      seen.add(e.slug);
      result.push({ href: `/zh/search/${e.slug}`, label: e.keyword });
    }
  };

  if (context?.platform && context?.goal) {
    add(all.filter((e) => e.platform === context.platform && e.goal === context.goal).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)), 5);
  }
  if (context?.audience) {
    add(all.filter((e) => e.audience === context.audience).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)), 5);
  }
  if (context?.platform) {
    add(all.filter((e) => e.platform === context.platform).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)), 5);
  }
  if (context?.goal) {
    add(all.filter((e) => e.goal === context.goal).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)), 5);
  }
  add(getLatestKeywordPages(20), limit - result.length);

  return result.slice(0, limit);
}
