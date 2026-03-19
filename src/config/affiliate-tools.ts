/**
 * V64 Affiliate Tools - Config-based tool recommendations
 * URLs from env: AFFILIATE_TOOL_1, AFFILIATE_TOOL_2, etc.
 * V76.5: Country-aware links via affiliateLinks.
 */

import type { CountryCode } from "./countries";

export type AffiliateToolCategory =
  | "ai-writing" // AI写作工具
  | "video-gen" // 视频生成工具
  | "growth"; // 增长工具

export type AffiliateToolPlatform = "tiktok" | "youtube" | "instagram" | "general";

export type AffiliateToolIntent = "变现" | "引流" | "general";

/** V76.5: Country-specific affiliate URLs. default = fallback. */
export type AffiliateLinks = {
  default: string;
  [country: string]: string;
};

export interface AffiliateTool {
  id: string;
  name: string;
  description: string;
  /** @deprecated Use affiliateLinks for country-aware. Kept for backward compat. */
  url: string;
  /** V76.5: Country-specific links. Use getAffiliateLink(tool, country). */
  affiliateLinks?: AffiliateLinks;
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
  /** V69: 工具组合角色 - 主推荐/替代方案/高价工具 */
  stackRole?: "primary" | "alternative" | "high-ticket";
  /** V69: 价格档位 - 免费/进阶/高价 $20-100/月 */
  priceTier?: "free" | "premium" | "high-ticket";
  /** V69: 用途描述 - 用于 Use Case Funnel */
  useCaseStep?: string;
  /** V70: 预估每点击收益 (USD) */
  payoutPerClickEstimate?: number;
  /** V70: 收益档位 - low 0.1, medium 0.5, high 1.5 */
  payoutTier?: "low" | "medium" | "high";
}

const TOOL_ENV_KEYS = [
  "AFFILIATE_TOOL_1",
  "AFFILIATE_TOOL_2",
  "AFFILIATE_TOOL_3",
  "AFFILIATE_TOOL_4",
  "AFFILIATE_TOOL_5"
] as const;

const PAYOUT_BY_TIER: Record<string, number> = { low: 0.1, medium: 0.5, high: 1.5 };

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
    isBestChoice: true,
    stackRole: "primary",
    priceTier: "free",
    useCaseStep: "生成内容",
    payoutPerClickEstimate: 0.5,
    payoutTier: "medium"
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
    suitableFor: "内容创作者",
    stackRole: "alternative",
    priceTier: "free",
    useCaseStep: "优化标题",
    payoutPerClickEstimate: 0.3,
    payoutTier: "low"
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
    suitableFor: "博主、商家",
    stackRole: "alternative",
    priceTier: "premium",
    useCaseStep: "分析数据",
    payoutPerClickEstimate: 0.5,
    payoutTier: "medium"
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
    suitableFor: "新手",
    stackRole: "alternative",
    priceTier: "free",
    useCaseStep: "优化标题",
    payoutPerClickEstimate: 0.3,
    payoutTier: "low"
  },
  {
    id: "growth-2",
    name: "流量变现工具",
    description: "从0到1实现账号变现，专业版 $20–100/月",
    category: "growth",
    platforms: ["tiktok", "youtube", "instagram", "general"],
    intents: ["变现", "引流", "general"],
    rating: 4.6,
    usersCount: "40,000+",
    isFree: false,
    suitableFor: "博主",
    stackRole: "high-ticket",
    priceTier: "high-ticket",
    useCaseStep: "分析数据",
    payoutPerClickEstimate: 1.5,
    payoutTier: "high"
  }
];

/** V70: Get payout per click for a tool */
export function getPayoutPerClick(tool: AffiliateTool): number {
  if (tool.payoutPerClickEstimate != null) return tool.payoutPerClickEstimate;
  if (tool.payoutTier) return PAYOUT_BY_TIER[tool.payoutTier] ?? 0.5;
  return 0.5;
}

function getAffiliateTools(): AffiliateTool[] {
  const result: AffiliateTool[] = [];
  for (let i = 0; i < Math.min(TOOL_ENV_KEYS.length, TOOL_CONFIGS.length); i++) {
    const url = process.env[TOOL_ENV_KEYS[i]];
    if (url) {
      result.push({
        ...TOOL_CONFIGS[i],
        url,
        affiliateLinks: buildAffiliateLinks(TOOL_ENV_KEYS[i], url)
      });
    }
  }
  return result;
}

/** Build affiliateLinks from env: AFFILIATE_TOOL_1, AFFILIATE_TOOL_1_US, AFFILIATE_TOOL_1_CN, etc. */
function buildAffiliateLinks(envKey: string, defaultUrl: string): AffiliateLinks {
  const base = envKey.replace("AFFILIATE_TOOL_", "");
  const links: AffiliateLinks = { default: defaultUrl };
  for (const country of ["US", "CN", "JP", "IN", "BR", "ES", "PT", "ID"]) {
    const key = `AFFILIATE_TOOL_${base}_${country}`;
    const val = process.env[key];
    if (val) links[country] = val;
  }
  return links;
}

/** V76.5: Get affiliate URL for a tool by country. Falls back to default. */
export function getAffiliateLink(tool: AffiliateTool, country: CountryCode): string {
  if (tool.affiliateLinks) {
    const code = String(country).toUpperCase();
    return tool.affiliateLinks[code] ?? tool.affiliateLinks.default ?? tool.url;
  }
  return tool.url;
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

/** V69: Get 3 tools for Multi-Tool Stack - 主推荐, 替代方案, 高价工具 */
export function getToolsForStack(
  tools: AffiliateTool[],
  metrics?: Map<string, { ctr: number }>
): AffiliateTool[] {
  if (tools.length === 0) return [];
  const sorted = [...tools].sort((a, b) => {
    const ctrA = metrics?.get(a.id)?.ctr ?? 0;
    const ctrB = metrics?.get(b.id)?.ctr ?? 0;
    if (ctrB !== ctrA) return ctrB - ctrA;
    return (b.rating ?? 0) - (a.rating ?? 0);
  });
  const primary = sorted.find((t) => t.stackRole === "primary") ?? sorted[0];
  const alternative = sorted.find((t) => t.stackRole === "alternative" && t.id !== primary?.id) ?? sorted[1];
  const highTicket = sorted.find((t) => t.stackRole === "high-ticket" || t.priceTier === "high-ticket") ?? sorted[2];
  const seen = new Set<string>();
  const result: AffiliateTool[] = [];
  for (const t of [primary, alternative, highTicket]) {
    if (t && !seen.has(t.id)) {
      seen.add(t.id);
      result.push(t);
    }
  }
  return result.length >= 3 ? result : sorted.slice(0, 3);
}

/** V69: Get tools for Use Case Funnel - 步骤1/2/3 */
export function getToolsForUseCaseFunnel(tools: AffiliateTool[]): AffiliateTool[] {
  if (tools.length === 0) return [];
  const byStep = new Map<string, AffiliateTool>();
  for (const t of tools) {
    const step = t.useCaseStep || "工具";
    if (!byStep.has(step)) byStep.set(step, t);
  }
  const order = ["生成内容", "优化标题", "分析数据"];
  const result: AffiliateTool[] = [];
  for (const step of order) {
    const t = byStep.get(step);
    if (t) result.push(t);
  }
  return result.length >= 3 ? result : tools.slice(0, 3);
}

export { getAffiliateTools };
