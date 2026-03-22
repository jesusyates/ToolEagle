/**
 * V99 — Market/locale-scoped cache keys so entries never leak across regions.
 * Pattern: `{market}:{locale}:{path}` e.g. `cn:zh:/tiktok-caption-generator`
 */

export type MarketLocaleCacheInput = {
  market: "global" | "cn" | string;
  locale: string;
  /** Logical route or segment, should start with / (e.g. /zh/pricing) */
  path: string;
};

/** Normalize path and build stable cache key / unstable_cache key part */
export function buildMarketLocaleCacheKey(input: MarketLocaleCacheInput): string {
  let p = input.path.trim();
  if (!p.startsWith("/")) p = `/${p}`;
  return `${input.market}:${input.locale}:${p}`;
}

/** Shorthand for global English primary site */
export function buildGlobalEnCacheKey(path: string): string {
  return buildMarketLocaleCacheKey({ market: "global", locale: "en", path });
}
