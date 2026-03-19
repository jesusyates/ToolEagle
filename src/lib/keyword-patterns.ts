/**
 * v59 Programmatic Keyword Mining Engine
 * Generate SEO pages from real search keyword patterns.
 */

export const KEYWORD_PLATFORMS = ["tiktok", "youtube", "instagram"] as const;
export type KeywordPlatform = (typeof KEYWORD_PLATFORMS)[number];

export const KEYWORD_GOALS = [
  "涨粉",
  "获得播放量",
  "做爆款视频",
  "提高互动率",
  "账号起号",
  "变现",
  "做爆款",
  "引流",
  "做内容",
  "提高完播率",
  "直播带货",
  "私域引流",
  "品牌打造",
  "算法优化",
  "数据分析"
] as const;
export type KeywordGoal = (typeof KEYWORD_GOALS)[number];

export const PLATFORM_NAMES: Record<KeywordPlatform, string> = {
  tiktok: "TikTok",
  youtube: "YouTube",
  instagram: "Instagram"
};

/** Pattern templates: {platform} and {goal} are placeholders */
export const KEYWORD_PATTERNS = [
  { id: "ruhe", template: "如何在 {platform} 上 {goal}", slug: "ruhe" },
  { id: "fangfa", template: "{platform} {goal} 方法", slug: "fangfa" },
  { id: "zenme", template: "{platform} 怎么 {goal}", slug: "zenme" },
  { id: "jiqiao", template: "{platform} {goal} 技巧", slug: "jiqiao" },
  { id: "2026", template: "{platform} {goal} 2026", slug: "2026" },
  { id: "mijue", template: "{platform} {goal} 秘诀", slug: "mijue" },
  { id: "gonglue", template: "{platform} {goal} 攻略", slug: "gonglue" },
  { id: "rumen", template: "{platform} {goal} 入门", slug: "rumen" },
  { id: "jiaocheng", template: "{platform} {goal} 教程", slug: "jiaocheng" },
  { id: "xinshou", template: "{platform} {goal} 新手", slug: "xinshou" },
  { id: "gaoxiao", template: "{platform} {goal} 高效", slug: "gaoxiao" },
  { id: "kuaisu", template: "{platform} 快速 {goal}", slug: "kuaisu" },
  { id: "shizhan", template: "{platform} {goal} 实战", slug: "shizhan" },
  { id: "wanzheng", template: "{platform} {goal} 完整指南", slug: "wanzheng" },
  { id: "jinjie", template: "{platform} {goal} 进阶", slug: "jinjie" },
  // V77: Question expansion for AI citation
  { id: "zenmezuo", template: "{platform} {goal} 怎么做？", slug: "zenmezuo" },
  { id: "xuyaoduojiu", template: "{platform} {goal} 需要多久？", slug: "xuyaoduojiu" },
  { id: "kaopuma", template: "{platform} {goal} 靠谱吗？", slug: "kaopuma" },
  { id: "nengzhuanqianma", template: "{platform} {goal} 能赚钱吗？", slug: "nengzhuanqianma" },
  { id: "xinshouzenme", template: "{platform} {goal} 新手怎么开始？", slug: "xinshouzenme" }
] as const;

export type KeywordPatternId = (typeof KEYWORD_PATTERNS)[number]["id"];

export interface KeywordEntry {
  keyword: string;
  platform: KeywordPlatform;
  goal: KeywordGoal;
  patternId: KeywordPatternId;
  slug: string;
  /** v63: optional dimensions */
  audience?: string;
  format?: string;
  time?: string;
}

const GOAL_SLUGS: Record<KeywordGoal, string> = {
  涨粉: "zhangfen",
  "获得播放量": "bofangliang",
  "做爆款视频": "baokuan",
  "提高互动率": "hudong",
  "账号起号": "qihao",
  变现: "bianxian",
  做爆款: "baokuan-v2",
  引流: "yinliu",
  "做内容": "neirong",
  "提高完播率": "wanbolv",
  "直播带货": "daihuo",
  "私域引流": "siyu",
  "品牌打造": "pinpai",
  "算法优化": "suanfa",
  "数据分析": "shuju"
};

function fillPattern(template: string, platform: string, goal: string): string {
  return template.replace("{platform}", platform).replace("{goal}", goal);
}

/** Generate all keywords from patterns × platforms × goals */
export function generateAllKeywords(limit = 1000): KeywordEntry[] {
  const entries: KeywordEntry[] = [];
  const seen = new Set<string>();

  for (const platform of KEYWORD_PLATFORMS) {
    const platformName = PLATFORM_NAMES[platform];
    for (const goal of KEYWORD_GOALS) {
      for (const pattern of KEYWORD_PATTERNS) {
        const keyword = fillPattern(pattern.template, platformName, goal);
        const slug = `${platform}-${GOAL_SLUGS[goal]}-${pattern.slug}`;
        if (seen.has(slug)) continue;
        seen.add(slug);
        entries.push({
          keyword,
          platform,
          goal,
          patternId: pattern.id,
          slug
        });
        if (entries.length >= limit) return entries;
      }
    }
  }
  return entries;
}

/** Get keyword by slug - supports legacy (platform-goal-pattern) and V63 (v63-*) slugs */
export function getKeywordBySlug(slug: string): KeywordEntry | null {
  if (slug.startsWith("v63-")) {
    const { getKeywordCacheEntry } = require("./zh-keyword-content");
    const data = getKeywordCacheEntry(slug);
    if (!data) return null;
    const keyword = data.h1 ?? data.title ?? slug;
    const platform = (data.platform ?? "tiktok") as KeywordPlatform;
    const goal = (data.goal ?? "涨粉") as KeywordGoal;
    return {
      keyword,
      platform,
      goal,
      patternId: "ruhe",
      slug,
      audience: data.audience,
      format: data.format,
      time: data.time
    };
  }
  const all = generateAllKeywords(2000);
  return all.find((e) => e.slug === slug) ?? null;
}

/** Get related keywords (same platform or same goal) */
export function getRelatedKeywords(entry: KeywordEntry, limit = 8): KeywordEntry[] {
  const all = generateAllKeywords(1000);
  return all
    .filter((e) => e.slug !== entry.slug && (e.platform === entry.platform || e.goal === entry.goal))
    .slice(0, limit);
}

/** v61/v63: Get related keywords filtered by existing slugs. Match: same platform, goal, OR audience */
export function getRelatedKeywordsFiltered(
  entry: KeywordEntry,
  existingSlugs: Set<string>,
  limit = 12
): KeywordEntry[] {
  const legacy = generateAllKeywords(2000).filter((e) => existingSlugs.has(e.slug));
  const v63Entries = getV63EntriesFromCache(existingSlugs);
  const all = [...legacy, ...v63Entries];
  return all
    .filter(
      (e) =>
        e.slug !== entry.slug &&
        (e.platform === entry.platform ||
          e.goal === entry.goal ||
          (entry.audience && e.audience === entry.audience))
    )
    .slice(0, limit);
}

function getV63EntriesFromCache(existingSlugs: Set<string>): KeywordEntry[] {
  try {
    const { getAllV63EntriesFromCache } = require("./zh-keyword-content");
    const all = getAllV63EntriesFromCache();
    return all
      .filter((e: { slug: string }) => existingSlugs.has(e.slug))
      .map((data: { slug: string; h1?: string; title?: string; platform?: string; goal?: string; audience?: string; format?: string; time?: string }) => ({
        keyword: data.h1 ?? data.title ?? data.slug,
        platform: (data.platform ?? "tiktok") as KeywordPlatform,
        goal: (data.goal ?? "涨粉") as KeywordGoal,
        patternId: "ruhe" as const,
        slug: data.slug,
        audience: data.audience,
        format: data.format,
        time: data.time
      }));
  } catch {
    return [];
  }
}
