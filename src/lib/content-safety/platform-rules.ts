/**
 * V104 — Per-platform compliance hints for post-package output (heuristic, not legal advice).
 * Merged at runtime by market: CN → douyin (+ xhs scaffold); global → tiktok + youtube.
 */

export type ContentPlatform = "douyin" | "xiaohongshu" | "tiktok" | "youtube";

export type PlatformRuleSet = {
  /** Case-insensitive substring hits (for detection + soft replacement) */
  bannedWords: string[];
  /** Ordered replacements: first match wins per pass */
  rewriteRules: { pattern: RegExp; replacement: string }[];
  /** Regex patterns that count as “risk detected” (logged, may trigger extra rewrites) */
  riskyPatterns: { pattern: RegExp; code: string }[];
};

/** Conservative lists — expand via config later; never claim full compliance */
export const PLATFORM_RULES: Record<ContentPlatform, PlatformRuleSet> = {
  douyin: {
    bannedWords: [
      "百分百",
      "100%",
      "包过",
      "必火",
      "稳赚",
      "躺赚",
      "暴富",
      "一夜致富",
      "绝对有效",
      "国家级",
      "最牛逼",
      "全网最低",
      "永久封号",
      "绕过审核",
      "刷量",
      "买粉",
      "全网第一"
    ],
    rewriteRules: [
      { pattern: /100\s*%/gi, replacement: "高比例" },
      { pattern: /百分百/g, replacement: "大多数情况下" },
      { pattern: /保证|包过|必火/g, replacement: "有助于提升" },
      { pattern: /稳赚|躺赚|暴富|一夜致富/g, replacement: "有机会改善收益" },
      { pattern: /微信|威信|vx|V信|加微|薇信/gi, replacement: "平台内私信" },
      { pattern: /whatsapp|wa\s*号|what\s*app/gi, replacement: "官方私信" },
      { pattern: /引流到私域|导流到微信/g, replacement: "引导平台内互动" },
      { pattern: /绕过|规避.{0,4}审核/g, replacement: "符合社区规范地优化" },
      { pattern: /刷量|买粉|买赞/g, replacement: "自然增长" }
    ],
    riskyPatterns: [
      { pattern: /加.{0,3}微|扫.{0,3}码.{0,6}群/gi, code: "offsite_contact" },
      { pattern: /百分百成功|绝对有效/g, code: "absolute_claim" },
      { pattern: /国家级|最.{0,2}第一(?!步)/g, code: "superlative_risk" }
    ]
  },
  xiaohongshu: {
    bannedWords: [
      "治愈",
      "医疗功效",
      "减肥神器",
      "私信领取",
      "加微信",
      "最佳种草"
    ],
    rewriteRules: [
      { pattern: /治愈|医疗功效|减肥神器/g, replacement: "个人体验分享（非医疗建议）" },
      { pattern: /私信领取|加微信|加威信/gi, replacement: "评论区交流" },
      { pattern: /100\s*%|百分百/gi, replacement: "很多情况下" }
    ],
    riskyPatterns: [
      { pattern: /医疗器械|处方|药效/g, code: "medical_claim" },
      { pattern: /私信.{0,4}发链接/gi, code: "dm_link" }
    ]
  },
  tiktok: {
    bannedWords: [
      "guaranteed",
      "100% cure",
      "get rich quick",
      "miracle",
      "hack the algorithm",
      "buy followers",
      "whatsapp me",
      "dm me on whatsapp"
    ],
    rewriteRules: [
      { pattern: /\b100%\s*(guaranteed|cure|works)\b/gi, replacement: "often works for many creators" },
      { pattern: /\bguaranteed\b/gi, replacement: "designed to help" },
      { pattern: /\b(get rich quick|make \$\$\$ overnight)\b/gi, replacement: "build income over time" },
      { pattern: /\b(buy followers|buy views|bot)\b/gi, replacement: "grow organically" },
      { pattern: /\bwhatsapp\b/gi, replacement: "in-app messages" },
      { pattern: /\b(telegram|discord)\s*(link|server)\b/gi, replacement: "community link in bio if allowed" },
      { pattern: /\bhack the algorithm\b/gi, replacement: "work with the algorithm" }
    ],
    riskyPatterns: [
      { pattern: /\b(guaranteed|100%)\b.*\b(results|money)\b/gi, code: "absolute_claim_en" },
      { pattern: /\b(whatsapp|telegram)\b.*\b(dm|message)\b/gi, code: "offsite_en" }
    ]
  },
  youtube: {
    bannedWords: [
      "guaranteed income",
      "click here now",
      "subscribe or else",
      "free money",
      "no effort"
    ],
    rewriteRules: [
      { pattern: /\b(guaranteed income|free money|no effort)\b/gi, replacement: "realistic outcomes with effort" },
      { pattern: /\bclick here now\b/gi, replacement: "learn more in the description" },
      { pattern: /\bsubscribe or else\b/gi, replacement: "subscribe if this helps" },
      { pattern: /\bwhatsapp\b/gi, replacement: "community tab or email in about" }
    ],
    riskyPatterns: [
      { pattern: /\b(make \$\d+k)\s*(guaranteed|fast)\b/gi, code: "income_claim" },
      { pattern: /\b(sub4sub|sub for sub)\b/gi, code: "sub4sub" }
    ]
  }
};

export type SafetyProfileId = "cn_merged" | "global_merged";

/** CN: douyin primary + xhs overlap; Global: tiktok + youtube union */
export function rulesForMarket(market: "cn" | "global"): { profile: SafetyProfileId; rules: MergedRules } {
  if (market === "cn") {
    return { profile: "cn_merged", rules: mergeRules([PLATFORM_RULES.douyin, PLATFORM_RULES.xiaohongshu]) };
  }
  return { profile: "global_merged", rules: mergeRules([PLATFORM_RULES.tiktok, PLATFORM_RULES.youtube]) };
}

export type MergedRules = {
  bannedWords: string[];
  rewriteRules: { pattern: RegExp; replacement: string }[];
  riskyPatterns: { pattern: RegExp; code: string }[];
};

function mergeRules(sets: PlatformRuleSet[]): MergedRules {
  const banned = new Set<string>();
  for (const s of sets) {
    for (const w of s.bannedWords) banned.add(w.toLowerCase());
  }
  const rewriteRules = [...sets.flatMap((s) => s.rewriteRules)];
  const riskyPatterns = [...sets.flatMap((s) => s.riskyPatterns)];
  return {
    bannedWords: [...banned],
    rewriteRules,
    riskyPatterns
  };
}
