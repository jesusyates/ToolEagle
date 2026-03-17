/**
 * V63 Keyword Expansion Engine - Scale x10
 * platform × goal × audience × format × time
 */

import { KEYWORD_PLATFORMS, KEYWORD_GOALS, PLATFORM_NAMES } from "./keyword-patterns";
import type { KeywordPlatform } from "./keyword-patterns";
import type { KeywordGoal } from "./keyword-patterns";

export const AUDIENCES = ["新手", "小白", "个人", "博主", "商家"] as const;
export const TIMES = ["2026", "最新", "快速", "7天", "3天"] as const;
export const FORMATS = ["教程", "方法", "技巧", "指南", "模板"] as const;

const AUDIENCE_SLUGS: Record<(typeof AUDIENCES)[number], string> = {
  新手: "xinshou",
  小白: "xiaobai",
  个人: "geren",
  博主: "bozhu",
  商家: "shangjia"
};

const TIME_SLUGS: Record<(typeof TIMES)[number], string> = {
  "2026": "26",
  最新: "zx",
  快速: "ks",
  "7天": "7d",
  "3天": "3d"
};

const FORMAT_SLUGS: Record<(typeof FORMATS)[number], string> = {
  教程: "jc",
  方法: "ff",
  技巧: "jq",
  指南: "zn",
  模板: "mb"
};

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

export type KeywordEntryV63 = {
  keyword: string;
  slug: string;
  platform: KeywordPlatform;
  goal: KeywordGoal;
  audience: (typeof AUDIENCES)[number];
  format: (typeof FORMATS)[number];
  time: (typeof TIMES)[number];
};

/** Levenshtein distance */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

/** Skip if too similar to any existing (Levenshtein ratio < 0.5) */
function isTooSimilar(keyword: string, existing: string[]): boolean {
  const len = keyword.length;
  for (const ex of existing) {
    const dist = levenshtein(keyword, ex);
    const maxLen = Math.max(len, ex.length);
    const ratio = 1 - dist / maxLen;
    if (ratio > 0.7) return true;
  }
  return false;
}

/** Length filter: 6-30 chars */
function isValidLength(keyword: string): boolean {
  const len = keyword.length;
  return len >= 6 && len <= 30;
}

/** Collect candidates from all patterns, then filter and dedupe */
function* generateV63Candidates(): Generator<KeywordEntryV63> {
  const platforms = [...KEYWORD_PLATFORMS];
  const goals = [...KEYWORD_GOALS];
  const audiences = [...AUDIENCES];
  const formats = [...FORMATS];
  const times = [...TIMES];

  for (const platform of platforms) {
    const pName = PLATFORM_NAMES[platform];
    for (const audience of audiences) {
      for (const goal of goals) {
        const keyword = `${pName}${audience}如何${goal}`;
        const slug = `v63-${platform}-${AUDIENCE_SLUGS[audience]}-${GOAL_SLUGS[goal]}-jc-zx`;
        yield { keyword, slug, platform, goal, audience, format: "教程", time: "最新" };
      }
    }
  }
  for (const platform of platforms) {
    const pName = PLATFORM_NAMES[platform];
    for (const goal of goals) {
      for (const time of times) {
        const keyword = `${pName}${goal}${time}实现方法`;
        const slug = `v63-${platform}-${GOAL_SLUGS[goal]}-${TIME_SLUGS[time]}-ff`;
        yield { keyword, slug, platform, goal, audience: "新手", format: "方法", time };
      }
    }
  }
  for (const platform of platforms) {
    const pName = PLATFORM_NAMES[platform];
    for (const goal of goals) {
      for (const format of formats) {
        const keyword = `${pName}${goal}${format}大全`;
        const slug = `v63-${platform}-${GOAL_SLUGS[goal]}-${FORMAT_SLUGS[format]}-daquan`;
        yield { keyword, slug, platform, goal, audience: "个人", format, time: "2026" };
      }
    }
  }
  for (const platform of platforms) {
    const pName = PLATFORM_NAMES[platform];
    for (const goal of goals) {
      yield {
        keyword: `${pName}${goal}最快的方法`,
        slug: `v63-${platform}-${GOAL_SLUGS[goal]}-zk`,
        platform,
        goal,
        audience: "博主",
        format: "方法",
        time: "快速"
      };
      yield {
        keyword: `${pName}${goal}详细教程`,
        slug: `v63-${platform}-${GOAL_SLUGS[goal]}-xxjc`,
        platform,
        goal,
        audience: "个人",
        format: "教程",
        time: "2026"
      };
    }
  }
}

/** Generate V63 keywords: max 200 per run, dedupe, quality filter */
export function generateV63Keywords(
  existingSlugs: Set<string>,
  existingKeywords: string[],
  limit = 200
): KeywordEntryV63[] {
  const results: KeywordEntryV63[] = [];
  const seenKeywords: string[] = [...existingKeywords];

  for (const entry of generateV63Candidates()) {
    if (results.length >= limit) break;
    if (existingSlugs.has(entry.slug)) continue;
    if (!isValidLength(entry.keyword)) continue;
    if (isTooSimilar(entry.keyword, seenKeywords)) continue;
    seenKeywords.push(entry.keyword);
    results.push(entry);
  }
  return results;
}

/** Build KeywordEntry-like object from V63 entry (for compatibility) */
export function toKeywordEntryLike(entry: KeywordEntryV63) {
  return {
    keyword: entry.keyword,
    platform: entry.platform,
    goal: entry.goal,
    slug: entry.slug,
    audience: entry.audience,
    format: entry.format,
    time: entry.time
  };
}
