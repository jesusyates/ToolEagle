import { unstable_cache } from "next/cache";
import { buildMarketLocaleCacheKey } from "@/lib/cache/market-cache-key";
import { getLatestKeywordPages, type ZhKeywordWithMeta } from "@/lib/zh-keyword-data";

/**
 * V99 — CN + zh sidebar keyword lists cached per route so Global EN pages never share entries.
 * Use canonical tool path e.g. `/zh/tiktok-caption-generator`.
 */
export function getLatestKeywordPagesCnSidebarCached(
  limit: number,
  canonicalZhPath: string
): Promise<ZhKeywordWithMeta[]> {
  const key = buildMarketLocaleCacheKey({
    market: "cn",
    locale: "zh",
    path: canonicalZhPath
  });
  return unstable_cache(
    async () => getLatestKeywordPages(limit),
    [key, "latest-kw-sidebar", String(limit)],
    { revalidate: 180, tags: ["zh-keywords", key] }
  )();
}
