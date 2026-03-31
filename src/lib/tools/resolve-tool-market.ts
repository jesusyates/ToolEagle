import { tools } from "@/config/tools";

export type MarketCode = string;

/**
 * 数据隔离：按 `tool_slug` 推导它属于哪个市场。
 * 当前规则：
 * - `market` 显式配置则优先使用
 * - 否则 `cnOnly=true` => `cn`
 * - 其它 => `global`
 */
export function resolveToolMarket(toolSlug: string, fallback: MarketCode = "global"): MarketCode {
  const t = tools.find((x) => x.slug === toolSlug);
  if (!t) return fallback;
  if (t.market) return t.market;
  if (t.cnOnly) return "cn";
  return fallback;
}

