/**
 * V64 Affiliate Tools - Config-based tool recommendations
 * URLs from env: AFFILIATE_TOOL_1, AFFILIATE_TOOL_2, etc.
 */

export type AffiliateToolCategory =
  | "ai-writing" // AI写作工具
  | "video-gen" // 视频生成工具
  | "growth"; // 增长工具

export type AffiliateToolPlatform = "tiktok" | "youtube" | "instagram" | "general";

export type AffiliateToolIntent = "变现" | "引流" | "general";

export interface AffiliateTool {
  id: string;
  name: string;
  description: string;
  url: string;
  category: AffiliateToolCategory;
  platforms: AffiliateToolPlatform[];
  intents: AffiliateToolIntent[];
  /** V65: rating 1-5 */
  rating?: number;
  /** V65: e.g. "100,000+" */
  usersCount?: string;
  /** V65: e.g. "最推荐", "新手必备" */
  tag?: string;
  /** V65: 是否免费 */
  isFree?: boolean;
  /** V65: 适合人群 */
  suitableFor?: string;
  /** V65: 是否最佳选择 */
  isBestChoice?: boolean;
}

const TOOL_ENV_KEYS = [
  "AFFILIATE_TOOL_1",
  "AFFILIATE_TOOL_2",
  "AFFILIATE_TOOL_3",
  "AFFILIATE_TOOL_4",
  "AFFILIATE_TOOL_5"
] as const;

const TOOL_CONFIGS: Omit<AffiliateTool, "url">[] = [
  {
    id: "ai-writing-1",
    name: "AI写作工具",
    description: "一键生成爆款文案，提升创作效率10倍",
    category: "ai-writing",
    platforms: ["tiktok", "youtube", "instagram", "general"],
    intents: ["变现", "引流", "general"],
    rating: 4.8,
    usersCount: "100,000+",
    tag: "最推荐",
    isFree: true,
    suitableFor: "新手、博主",
    isBestChoice: true
  },
  {
    id: "video-gen-1",
    name: "视频生成工具",
    description: "AI自动生成短视频，省时省力",
    category: "video-gen",
    platforms: ["tiktok", "youtube", "instagram", "general"],
    intents: ["变现", "引流", "general"],
    rating: 4.6,
    usersCount: "50,000+",
    tag: "新手必备",
    isFree: true,
    suitableFor: "内容创作者"
  },
  {
    id: "growth-1",
    name: "增长工具",
    description: "精准分析数据，快速涨粉变现",
    category: "growth",
    platforms: ["tiktok", "youtube", "instagram", "general"],
    intents: ["变现", "引流", "general"],
    rating: 4.7,
    usersCount: "80,000+",
    tag: "限时免费",
    isFree: true,
    suitableFor: "博主、商家"
  },
  {
    id: "ai-writing-2",
    name: "文案生成器",
    description: "AI智能生成爆款标题和钩子",
    category: "ai-writing",
    platforms: ["tiktok", "youtube", "instagram", "general"],
    intents: ["变现", "引流", "general"],
    rating: 4.5,
    usersCount: "30,000+",
    tag: "新手必备",
    isFree: true,
    suitableFor: "新手"
  },
  {
    id: "growth-2",
    name: "流量变现工具",
    description: "从0到1实现账号变现",
    category: "growth",
    platforms: ["tiktok", "youtube", "instagram", "general"],
    intents: ["变现", "引流", "general"],
    rating: 4.6,
    usersCount: "40,000+",
    isFree: true,
    suitableFor: "博主"
  }
];

function getAffiliateTools(): AffiliateTool[] {
  const result: AffiliateTool[] = [];
  for (let i = 0; i < Math.min(TOOL_ENV_KEYS.length, TOOL_CONFIGS.length); i++) {
    const url = process.env[TOOL_ENV_KEYS[i]];
    if (url) {
      result.push({
        ...TOOL_CONFIGS[i],
        url
      });
    }
  }
  return result;
}

/** Get tools matching keyword context (platform + intent) */
export function getMatchingAffiliateTools(
  keyword: string,
  platform?: string,
  limit = 3
): AffiliateTool[] {
  const all = getAffiliateTools();
  if (all.length === 0) return [];

  const kw = (keyword || "").toLowerCase();
  const p = (platform || "").toLowerCase();

  const scored = all.map((t) => {
    let score = 0;
    if (p && t.platforms.includes(p as AffiliateToolPlatform)) score += 2;
    if (/tiktok|抖音/.test(kw) && t.platforms.includes("tiktok")) score += 2;
    if (/youtube|油管/.test(kw) && t.platforms.includes("youtube")) score += 2;
    if (/instagram|ins/.test(kw) && t.platforms.includes("instagram")) score += 2;
    if (/变现|赚钱/.test(kw) && t.intents.includes("变现")) score += 2;
    if (/引流/.test(kw) && t.intents.includes("引流")) score += 2;
    if (score === 0) score = 1;
    return { tool: t, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.tool);
}

export { getAffiliateTools };
