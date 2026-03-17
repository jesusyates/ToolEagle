/**
 * V63.1 Keyword Expansion - Aggressive scale x20
 * - Long-tail + question patterns
 * - Keyword scoring (high-intent boost)
 * - 80% similarity dedupe, normalize
 */

const PLATFORMS = ["tiktok", "youtube", "instagram"];
const PLATFORM_NAMES = { tiktok: "TikTok", youtube: "YouTube", instagram: "Instagram" };
const GOALS = [
  "涨粉", "获得播放量", "做爆款视频", "提高互动率", "账号起号",
  "变现", "做爆款", "引流", "做内容",
  "提高完播率", "直播带货", "私域引流", "品牌打造", "算法优化", "数据分析"
];
const GOAL_SLUGS = {
  涨粉: "zhangfen", "获得播放量": "bofangliang", "做爆款视频": "baokuan",
  "提高互动率": "hudong", "账号起号": "qihao", 变现: "bianxian",
  做爆款: "baokuan-v2", 引流: "yinliu", "做内容": "neirong",
  "提高完播率": "wanbolv", "直播带货": "daihuo", "私域引流": "siyu",
  "品牌打造": "pinpai", "算法优化": "suanfa", "数据分析": "shuju"
};
const AUDIENCES = ["新手", "小白", "个人", "博主", "商家"];
const AUDIENCE_SLUGS = { 新手: "xinshou", 小白: "xiaobai", 个人: "geren", 博主: "bozhu", 商家: "shangjia" };
const TIMES = ["2026", "最新", "快速", "7天", "3天"];
const TIME_SLUGS = { "2026": "26", 最新: "zx", 快速: "ks", "7天": "7d", "3天": "3d" };
const FORMATS = ["教程", "方法", "技巧", "指南", "模板"];
const FORMAT_SLUGS = { 教程: "jc", 方法: "ff", 技巧: "jq", 指南: "zn", 模板: "mb" };

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
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

function normalizeKeyword(kw) {
  return (kw || "").trim().toLowerCase();
}

function scoreKeyword(keyword) {
  let score = 0;
  const k = (keyword || "").toLowerCase();
  if (/赚钱|变现/.test(k)) score += 2;
  if (/教程|方法/.test(k)) score += 1;
  if (/新手/.test(k)) score += 1;
  if (/引流/.test(k)) score += 2; // high intent
  return score;
}

function isTooSimilar(keyword, existing, threshold = 0.8) {
  for (const ex of existing) {
    const dist = levenshtein(keyword, ex);
    const ratio = 1 - dist / Math.max(keyword.length, ex.length);
    if (ratio > threshold) return true;
  }
  return false;
}

function isValidLength(keyword) {
  const len = keyword.length;
  return len >= 6 && len <= 30;
}

function* generateV63Candidates() {
  for (const platform of PLATFORMS) {
    const pName = PLATFORM_NAMES[platform];
    for (const audience of AUDIENCES) {
      for (const goal of GOALS) {
        yield {
          keyword: `${pName}${audience}如何${goal}`,
          slug: `v63-${platform}-${AUDIENCE_SLUGS[audience]}-${GOAL_SLUGS[goal]}-jc-zx`,
          platform, goal, audience, format: "教程", time: "最新"
        };
      }
    }
  }
  for (const platform of PLATFORMS) {
    const pName = PLATFORM_NAMES[platform];
    for (const goal of GOALS) {
      for (const time of TIMES) {
        yield {
          keyword: `${pName}${goal}${time}实现方法`,
          slug: `v63-${platform}-${GOAL_SLUGS[goal]}-${TIME_SLUGS[time]}-ff`,
          platform, goal, audience: "新手", format: "方法", time
        };
      }
    }
  }
  for (const platform of PLATFORMS) {
    const pName = PLATFORM_NAMES[platform];
    for (const goal of GOALS) {
      for (const format of FORMATS) {
        yield {
          keyword: `${pName}${goal}${format}大全`,
          slug: `v63-${platform}-${GOAL_SLUGS[goal]}-${FORMAT_SLUGS[format]}-daquan`,
          platform, goal, audience: "个人", format, time: "2026"
        };
      }
    }
  }
  for (const platform of PLATFORMS) {
    const pName = PLATFORM_NAMES[platform];
    for (const goal of GOALS) {
      yield {
        keyword: `${pName}${goal}最快的方法`,
        slug: `v63-${platform}-${GOAL_SLUGS[goal]}-zk`,
        platform, goal, audience: "博主", format: "方法", time: "快速"
      };
      yield {
        keyword: `${pName}${goal}详细教程`,
        slug: `v63-${platform}-${GOAL_SLUGS[goal]}-xxjc`,
        platform, goal, audience: "个人", format: "教程", time: "2026"
      };
    }
  }
  // V63.1 Long-tail explosion patterns
  const LONG_TAIL_SUFFIXES = [
    { s: "适合新手吗", slug: "xinshou-ma" },
    { s: "真的能赚钱吗", slug: "zhuanqian-ma" },
    { s: "需要多少粉丝", slug: "fensi" },
    { s: "一天能赚多少", slug: "yitian" },
    { s: "详细步骤", slug: "buzhou" },
    { s: "避坑指南", slug: "bikeng" }
  ];
  for (const platform of PLATFORMS) {
    const pName = PLATFORM_NAMES[platform];
    for (const goal of GOALS) {
      for (const { s, slug } of LONG_TAIL_SUFFIXES) {
        yield {
          keyword: `${pName}${goal}${s}`,
          slug: `v63-${platform}-${GOAL_SLUGS[goal]}-${slug}`,
          platform, goal, audience: "新手", format: "指南", time: "2026"
        };
      }
    }
  }
  // V63.1 Question-based keywords
  for (const platform of PLATFORMS) {
    const pName = PLATFORM_NAMES[platform];
    for (const goal of GOALS) {
      yield {
        keyword: `如何在${pName}${goal}？`,
        slug: `v63-${platform}-${GOAL_SLUGS[goal]}-q-ruhe`,
        platform, goal, audience: "新手", format: "方法", time: "2026"
      };
      yield {
        keyword: `${pName}${goal}靠谱吗？`,
        slug: `v63-${platform}-${GOAL_SLUGS[goal]}-q-kaopu`,
        platform, goal, audience: "个人", format: "指南", time: "2026"
      };
      yield {
        keyword: `${pName}${goal}怎么做最简单？`,
        slug: `v63-${platform}-${GOAL_SLUGS[goal]}-q-zuijian`,
        platform, goal, audience: "新手", format: "方法", time: "2026"
      };
    }
  }
}

function generateV63Keywords(existingSlugs, existingKeywords, limit = 200) {
  const results = [];
  const seenKeywords = (existingKeywords || []).map((k) => normalizeKeyword(k)).filter(Boolean);
  for (const entry of generateV63Candidates()) {
    const kw = normalizeKeyword(entry.keyword);
    if (!kw) continue;
    if (existingSlugs.has(entry.slug)) continue;
    if (!isValidLength(entry.keyword)) continue;
    if (isTooSimilar(kw, seenKeywords, 0.8)) continue;
    seenKeywords.push(kw);
    const score = scoreKeyword(entry.keyword);
    results.push({ ...entry, _score: score });
  }
  results.sort((a, b) => (b._score || 0) - (a._score || 0));
  return results.slice(0, limit).map(({ _score, ...e }) => e);
}

module.exports = { generateV63Keywords, scoreKeyword, normalizeKeyword };
