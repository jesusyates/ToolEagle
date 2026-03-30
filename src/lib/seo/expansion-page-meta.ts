import { getCachedExpansionExamples } from "@/lib/seo/cached-public-examples";
import type { SeoExpansionPageType } from "@/config/seo-expansion";

/** V171.2 — noindex when no examples render (empty DB + no fallback rows). */
export async function robotsForExpansionPage(topic: string, pageType: SeoExpansionPageType) {
  const rows = await getCachedExpansionExamples(topic, pageType);
  if (rows.length > 0) return undefined;
  return { index: false, follow: true } as const;
}
