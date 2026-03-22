/**
 * V88: Global keyword mapping - ZH money keywords → EN
 * Used for EN revenue replication and global expansion
 */

export const ZH_TO_EN_MONEY_KEYWORDS: Record<string, string> = {
  "TikTok 变现": "TikTok monetization",
  "YouTube 变现": "YouTube monetization",
  "Instagram 变现": "Instagram monetization",
  "TikTok 涨粉": "TikTok growth",
  "YouTube 涨粉": "YouTube growth",
  "Instagram 涨粉": "Instagram growth",
  "TikTok 引流": "TikTok traffic",
  "YouTube 引流": "YouTube traffic",
  "引流工具": "traffic generation tools",
  "变现方法": "monetization methods",
  "赚钱工具": "make money tools",
  "涨粉技巧": "growth tips",
  "做爆款": "viral content"
};

export const GLOBAL_EN_KEYWORDS = [
  "monetization",
  "make money",
  "grow on TikTok",
  "YouTube views",
  "Instagram followers",
  "TikTok monetization",
  "YouTube monetization",
  "traffic generation",
  "viral content"
] as const;

export const GLOBAL_PLATFORMS = ["tiktok", "youtube", "instagram"] as const;
export const GLOBAL_INTENTS = ["monetization", "growth", "traffic", "viral"] as const;

/** Convert zh money keyword to EN */
export function zhToEnKeyword(zhKeyword: string): string {
  return ZH_TO_EN_MONEY_KEYWORDS[zhKeyword] ?? zhKeyword;
}

/** V88: Full global keyword list - platform × intent × language (EN) */
export const GLOBAL_KEYWORD_LIST = [
  ...GLOBAL_EN_KEYWORDS,
  "TikTok monetization",
  "TikTok growth",
  "TikTok traffic",
  "YouTube monetization",
  "YouTube growth",
  "YouTube views",
  "Instagram monetization",
  "Instagram growth",
  "Instagram followers",
  "grow on TikTok",
  "make money on TikTok",
  "YouTube brand deals",
  "TikTok brand deals",
  "traffic generation tools",
  "creator monetization",
  "viral content",
  "short form video"
] as const;

/** Generate EN money page slugs from intent × platform */
export function getEnMoneyPageCandidates(limit = 100): Array<{ slug: string; keyword: string; platform: string; intent: string }> {
  const results: Array<{ slug: string; keyword: string; platform: string; intent: string }> = [];
  const seen = new Set<string>();

  const platformNames: Record<string, string> = { tiktok: "TikTok", youtube: "YouTube", instagram: "Instagram" };
  const suffixes: Record<string, string[]> = {
    monetization: ["monetization", "make-money", "earn-money", "creator-fund", "brand-deals"],
    growth: ["growth", "grow-followers", "get-views", "beginner-guide", "fast-growth"],
    traffic: ["traffic", "traffic-generation", "leads", "conversion"],
    viral: ["viral", "viral-content", "trending", "go-viral"]
  };

  for (const platform of GLOBAL_PLATFORMS) {
    const pName = platformNames[platform];
    for (const intent of GLOBAL_INTENTS) {
      for (const suffix of suffixes[intent] ?? [intent]) {
        const slug = `${platform}-${suffix}`;
        if (seen.has(slug)) continue;
        seen.add(slug);
        const keyword = `${pName} ${suffix.replace(/-/g, " ")}`;
        results.push({ slug, keyword, platform, intent });
        if (results.length >= limit) return results;
      }
    }
  }
  return results;
}
