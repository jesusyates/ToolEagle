import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchAlternateLocalePath,
  fetchInternalLinksForSlug,
  fetchProgrammaticPageRecord,
  slugToTitle,
  type InternalLinkItem,
  type ProgrammaticPageType,
  type PseoLocale,
  type SeoKeywordRow
} from "@/lib/programmatic-seo";

function keywordFromJoin(seoKeywords: unknown): string | null {
  if (!seoKeywords) return null;
  if (Array.isArray(seoKeywords)) {
    const first = seoKeywords[0] as { keyword?: string } | undefined;
    return first?.keyword ?? null;
  }
  return (seoKeywords as { keyword?: string }).keyword ?? null;
}

function normalizeKeywordRow(seoKeywords: unknown): SeoKeywordRow | null {
  if (!seoKeywords) return null;
  const o = (Array.isArray(seoKeywords) ? seoKeywords[0] : seoKeywords) as Record<string, unknown> | null;
  if (!o || typeof o !== "object") return null;
  return {
    id: String(o.id ?? ""),
    slug: String(o.slug ?? ""),
    keyword: String(o.keyword ?? ""),
    source: String(o.source ?? "aggregate"),
    revenue_score: Number(o.revenue_score ?? 0),
    locale: (o.locale === "zh" ? "zh" : "en") as PseoLocale,
    is_blacklisted: Boolean(o.is_blacklisted),
    quality_score: Number(o.quality_score ?? 0.5),
    review_status: (o.review_status === "pending" || o.review_status === "rejected" ? o.review_status : "approved") as SeoKeywordRow["review_status"]
  };
}

export type LoadedProgrammaticPage = {
  keyword: string;
  slug: string;
  locale: PseoLocale;
  primaryLinks: InternalLinkItem[];
  crossLocaleLinks: InternalLinkItem[];
  keywordRow: SeoKeywordRow | null;
  alternatePathOtherLocale: string | null;
};

export async function loadProgrammaticPage(
  pageType: ProgrammaticPageType,
  slug: string,
  locale: PseoLocale = "en"
): Promise<LoadedProgrammaticPage | null> {
  const admin = createAdminClient();
  const row = await fetchProgrammaticPageRecord(admin, pageType, slug, locale);
  if (!row) return null;

  const keywordRow = normalizeKeywordRow((row as { seo_keywords?: unknown }).seo_keywords);
  const keyword = keywordFromJoin((row as { seo_keywords?: unknown }).seo_keywords) ?? slugToTitle(slug);
  const { primary, crossLocale } = await fetchInternalLinksForSlug(admin, slug, 14, locale);
  const alternatePathOtherLocale = await fetchAlternateLocalePath(admin, pageType, slug, locale);

  return {
    keyword,
    slug,
    locale,
    primaryLinks: primary,
    crossLocaleLinks: crossLocale,
    keywordRow,
    alternatePathOtherLocale
  };
}
