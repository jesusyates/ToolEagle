/**
 * V93 / V93.1: Programmatic SEO — slugging, locale-safe links, generation guards, paths
 * V104.1: Synthetic content quality merged from pSEO content-safety helpers
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildPseoExampleLines,
  buildPseoPromptLines,
  evaluatePseoSyntheticContentQuality
} from "@/lib/seo/pseo-content-safety";

export type ProgrammaticPageType = "ai_generator" | "examples" | "how_to";
export type PseoLocale = "en" | "zh";

export type SeoKeywordRow = {
  id: string;
  slug: string;
  keyword: string;
  source: string;
  revenue_score: number;
  locale: PseoLocale;
  is_blacklisted: boolean;
  quality_score: number;
  review_status: "pending" | "approved" | "rejected";
  created_at?: string;
  updated_at?: string;
};

/** Priority money destinations for pseo CTAs (verified app routes). */
export const PSEO_MONEY_PAGE_TARGETS: { href: string; label: string; toolSlug?: string }[] = [
  { href: "/tiktok-caption-generator", label: "TikTok Caption Generator", toolSlug: "tiktok-caption-generator" },
  { href: "/youtube-title-generator", label: "YouTube Title Generator", toolSlug: "youtube-title-generator" },
  { href: "/hook-generator", label: "Hook Generator", toolSlug: "hook-generator" },
  { href: "/tools/tiktok-idea-generator", label: "AI Content & Video Ideas", toolSlug: "tiktok-idea-generator" },
  { href: "/tools/hashtag-generator", label: "Hashtag Generator", toolSlug: "hashtag-generator" }
];

export function keywordToSlug(keyword: string): string {
  return (
    keyword
      .trim()
      .toLowerCase()
      .replace(/[''`]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "keyword"
  );
}

export function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function inferLocaleFromPath(page: string): PseoLocale {
  const clean = page.replace(/^https?:\/\/[^/]+/i, "");
  return clean.startsWith("/zh") || clean.includes("/zh/") ? "zh" : "en";
}

export function buildExampleLines(keyword: string, count = 12, locale: PseoLocale = "en"): string[] {
  return buildPseoExampleLines(keyword, locale, count);
}

export function buildPromptLines(keyword: string, locale: PseoLocale = "en"): string[] {
  return buildPseoPromptLines(keyword, locale);
}

/** Combined keyword heuristic + V104.1 synthetic-line quality (for `seo_keywords.quality_score`). */
export function combinedProgrammaticQualityScore(keyword: string, slug: string, locale: PseoLocale): number {
  const h = heuristicQualityScore(keyword, slug);
  const ex = buildPseoExampleLines(keyword, locale, 12);
  const pr = buildPseoPromptLines(keyword, locale);
  const { score } = evaluatePseoSyntheticContentQuality(keyword, locale, ex, pr);
  return Math.max(0, Math.min(1, Math.min(h, score)));
}

export function pathForProgrammaticPage(type: ProgrammaticPageType, slug: string, locale: PseoLocale = "en"): string {
  const prefix = locale === "zh" ? "/zh/pseo" : "/pseo";
  if (type === "ai_generator") return `${prefix}/ai-generator/${slug}`;
  if (type === "examples") return `${prefix}/examples/${slug}`;
  return `${prefix}/how-to/${slug}`;
}

function pagePathToSlug(page: string): string | null {
  const clean = page.replace(/^https?:\/\/[^/]+/i, "");
  const parts = clean.split("/").filter(Boolean);
  const last = parts[parts.length - 1]?.replace(/\.(html|php)$/i, "") ?? "";
  if (!last || last.length < 2) return null;
  return keywordToSlug(last);
}

/** Heuristic 0–1 quality from keyword text (sync + guardrails). */
export function heuristicQualityScore(keyword: string, slug: string): number {
  const k = keyword.trim();
  let score = 0.5;
  if (k.length >= 8) score += 0.15;
  if (k.length >= 3 && k.length < 25) score += 0.1;
  if (slug.length >= 4 && slug.length <= 60) score += 0.1;
  const vague = /^(test|demo|aaa|xxx|untitled|new|page|post|item)\b/i;
  if (vague.test(k) || vague.test(slug)) score -= 0.35;
  if (k.length < 3 || slug.length < 3) score -= 0.4;
  return Math.max(0, Math.min(1, score));
}

export type GenerationSkipReason =
  | "blacklisted"
  | "rejected"
  | "pending_review"
  | "review_status_mismatch"
  | "low_revenue_score"
  | "low_quality_score"
  | "bad_slug"
  | "bad_keyword"
  | "locale_mismatch";

export function evaluateKeywordForGeneration(
  row: Pick<SeoKeywordRow, "slug" | "keyword" | "revenue_score" | "quality_score" | "is_blacklisted" | "review_status" | "locale">,
  opts: {
    minRevenueScore: number;
    minQualityScore: number;
    locale: PseoLocale;
    reviewStatus: "approved" | "pending" | "any";
  }
): { ok: true } | { ok: false; reason: GenerationSkipReason } {
  if (row.is_blacklisted) return { ok: false, reason: "blacklisted" };
  if (row.review_status === "rejected") return { ok: false, reason: "rejected" };
  if (opts.reviewStatus === "approved" && row.review_status !== "approved") {
    if (row.review_status === "pending") return { ok: false, reason: "pending_review" };
    return { ok: false, reason: "rejected" };
  }
  if (opts.reviewStatus === "pending" && row.review_status !== "pending") {
    return { ok: false, reason: "review_status_mismatch" };
  }
  if (row.locale !== opts.locale) return { ok: false, reason: "locale_mismatch" };
  const slug = String(row.slug || "").trim();
  const kw = String(row.keyword || "").trim();
  if (slug.length < 3 || slug === "keyword") return { ok: false, reason: "bad_slug" };
  if (kw.length < 3) return { ok: false, reason: "bad_keyword" };
  if (Number(row.revenue_score) < opts.minRevenueScore) return { ok: false, reason: "low_revenue_score" };
  if (Number(row.quality_score) < opts.minQualityScore) return { ok: false, reason: "low_quality_score" };
  return { ok: true };
}

/** True when page should be indexable (sitemap + robots). */
export function isKeywordIndexable(
  row: Pick<SeoKeywordRow, "is_blacklisted" | "review_status" | "quality_score" | "revenue_score">,
  thresholds: { minRevenueScore: number; minQualityScore: number }
): boolean {
  if (row.is_blacklisted) return false;
  if (row.review_status !== "approved") return false;
  if (Number(row.quality_score) < thresholds.minQualityScore) return false;
  if (Number(row.revenue_score) < thresholds.minRevenueScore) return false;
  return true;
}

/** Aggregate revenue_attribution + traffic_events into locale+slug → row */
export async function syncSeoKeywordsFromSignals(admin: SupabaseClient): Promise<{ upserted: number }> {
  type Acc = { keyword: string; score: number; source: string; locale: PseoLocale };
  const map = new Map<string, Acc>();

  const { data: revRows } = await admin.from("revenue_attribution").select("page, revenue").limit(5000);
  for (const r of revRows ?? []) {
    const page = String(r.page || "");
    const slug = pagePathToSlug(page);
    if (!slug) continue;
    const locale = inferLocaleFromPath(page);
    const key = `${locale}::${slug}`;
    const cur = map.get(key) ?? { keyword: slugToTitle(slug), score: 0, source: "revenue_attribution", locale };
    cur.score += Number(r.revenue ?? 0);
    map.set(key, cur);
  }

  const { data: teRows } = await admin.from("traffic_events").select("page, source").limit(5000);
  for (const t of teRows ?? []) {
    const page = String(t.page || "");
    const slug = pagePathToSlug(page);
    if (!slug) continue;
    const locale = inferLocaleFromPath(page);
    const key = `${locale}::${slug}`;
    const cur = map.get(key) ?? { keyword: slugToTitle(slug), score: 0, source: "traffic_events", locale };
    cur.score += 0.25;
    if (!cur.source.includes("traffic")) cur.source = `${cur.source}+traffic_events`;
    map.set(key, cur);
  }

  /** Only sync signal-derived fields; preserve review_status / is_blacklisted on conflict. */
  const batch = [...map.entries()].map(([key, v]) => {
    const slug = key.split("::")[1] ?? key;
    const qs = combinedProgrammaticQualityScore(v.keyword, slug, v.locale);
    return {
      slug,
      keyword: v.keyword,
      source: v.source.slice(0, 200),
      revenue_score: v.score,
      locale: v.locale,
      quality_score: qs,
      updated_at: new Date().toISOString()
    };
  });

  if (batch.length === 0) return { upserted: 0 };

  const { error } = await admin.from("seo_keywords").upsert(batch, { onConflict: "locale,slug" });
  return { upserted: error ? 0 : batch.length };
}

export type InternalLinkItem = { href: string; label: string; weight: number; crossLocale?: boolean };

type ProgrammaticRow = {
  path: string;
  slug: string;
  locale: PseoLocale;
  seo_keywords:
    | (SeoKeywordRow & { keyword: string; slug: string; revenue_score: number })
    | (SeoKeywordRow & { keyword: string; slug: string; revenue_score: number })[]
    | null;
};

export async function fetchAlternateLocalePath(
  admin: SupabaseClient,
  pageType: ProgrammaticPageType,
  slug: string,
  currentLocale: PseoLocale
): Promise<string | null> {
  const other: PseoLocale = currentLocale === "en" ? "zh" : "en";
  const { data } = await admin
    .from("programmatic_seo_pages")
    .select("path")
    .eq("page_type", pageType)
    .eq("slug", slug)
    .eq("locale", other)
    .maybeSingle();
  return (data?.path as string) ?? null;
}

export async function fetchProgrammaticPageRecord(
  admin: SupabaseClient,
  pageType: ProgrammaticPageType,
  slug: string,
  locale: PseoLocale
): Promise<ProgrammaticRow | null> {
  const { data, error } = await admin
    .from("programmatic_seo_pages")
    .select(
      "path, slug, locale, seo_keywords(id, keyword, slug, revenue_score, locale, is_blacklisted, quality_score, review_status, source)"
    )
    .eq("page_type", pageType)
    .eq("slug", slug)
    .eq("locale", locale)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as ProgrammaticRow;
}

/** EN: EN tools + landing pages; ZH: zh metrics + zh tools. Cross-locale links returned separately. */
export async function fetchInternalLinksForSlug(
  admin: SupabaseClient,
  slug: string,
  limit: number,
  locale: PseoLocale
): Promise<{ primary: InternalLinkItem[]; crossLocale: InternalLinkItem[] }> {
  const primary: InternalLinkItem[] = [];
  const crossLocale: InternalLinkItem[] = [];

  if (locale === "zh") {
    const { data: metrics } = await admin
      .from("zh_page_revenue_metrics")
      .select("page_slug, estimated_revenue")
      .order("estimated_revenue", { ascending: false })
      .limit(14);
    for (const m of metrics ?? []) {
      const s = m.page_slug as string;
      if (!s) continue;
      primary.push({
        href: `/zh/search/${s}`,
        label: slugToTitle(s.replace(/-/g, " ")),
        weight: Number(m.estimated_revenue ?? 0) + 100
      });
    }
    primary.push(
      { href: "/zh/tools/tiktok-caption-generator", label: "抖音/小红书标题工具", weight: 52 },
      { href: "/zh/tools/hook-generator", label: "高表现开头生成", weight: 50 },
      { href: `/zh/pseo/ai-generator/${slug}`, label: `AI ${slugToTitle(slug)} 生成`, weight: 42 },
      { href: `/zh/pseo/examples/${slug}`, label: `${slugToTitle(slug)} 示例`, weight: 40 },
      { href: `/zh/pseo/how-to/${slug}`, label: `如何做 ${slugToTitle(slug)}`, weight: 38 }
    );
    crossLocale.push(
      { href: `/pseo/ai-generator/${slug}`, label: `English: AI ${slugToTitle(slug)} generator`, weight: 5, crossLocale: true },
      { href: `/pseo/examples/${slug}`, label: `English: ${slugToTitle(slug)} examples`, weight: 4, crossLocale: true }
    );
  } else {
    for (const t of PSEO_MONEY_PAGE_TARGETS) {
      primary.push({ href: t.href, label: t.label, weight: 55 - primary.length * 0.5 });
    }
    primary.push(
      { href: "/tools/tiktok-caption-generator", label: "TikTok Caption Generator (tool)", weight: 48 },
      { href: "/ai-prompts", label: "AI prompt library", weight: 22 },
      { href: `/pseo/ai-generator/${slug}`, label: `AI ${slugToTitle(slug)} generator`, weight: 40 },
      { href: `/pseo/examples/${slug}`, label: `${slugToTitle(slug)} examples`, weight: 38 },
      { href: `/pseo/how-to/${slug}`, label: `How to ${slugToTitle(slug)}`, weight: 36 }
    );
    crossLocale.push(
      { href: `/zh/pseo/ai-generator/${slug}`, label: `中文：${slugToTitle(slug)} 生成`, weight: 5, crossLocale: true },
      { href: `/zh/pseo/examples/${slug}`, label: `中文：${slugToTitle(slug)} 示例`, weight: 4, crossLocale: true }
    );
  }

  primary.sort((a, b) => b.weight - a.weight);
  const seen = new Set<string>();
  const dedup: InternalLinkItem[] = [];
  for (const l of primary) {
    if (seen.has(l.href)) continue;
    seen.add(l.href);
    dedup.push(l);
    if (dedup.length >= limit) break;
  }
  return { primary: dedup, crossLocale };
}

/** Default thresholds aligned with generate-pages defaults. */
export const DEFAULT_INDEX_THRESHOLDS = {
  minRevenueScore: 0.01,
  minQualityScore: 0.25
};

export async function countIndexableProgrammaticPages(
  admin: SupabaseClient,
  thresholds = DEFAULT_INDEX_THRESHOLDS
): Promise<number> {
  const { data: rows } = await admin
    .from("programmatic_seo_pages")
    .select("id, seo_keywords(is_blacklisted, review_status, quality_score, revenue_score)");
  let n = 0;
  for (const row of rows ?? []) {
    const kw = row.seo_keywords as Record<string, unknown> | Record<string, unknown>[] | null;
    const k = (Array.isArray(kw) ? kw[0] : kw) as SeoKeywordRow | null | undefined;
    if (k && isKeywordIndexable(k, thresholds)) n++;
  }
  return n;
}

export type PseoHealthSnapshot = {
  seoKeywordCount: number;
  programmaticPageCount: number;
  indexableProgrammaticCount: number;
  filteredProgrammaticCount: number;
  lowQualityKeywordCount: number;
  blacklistedKeywordCount: number;
  pendingReviewKeywordCount: number;
};

export type IndexablePseoRow = { path: string; lastmod: string };

/** Sorted paths for sitemap (indexable only). */
export async function fetchIndexablePseoPathsForSitemap(
  admin: SupabaseClient,
  thresholds = DEFAULT_INDEX_THRESHOLDS
): Promise<IndexablePseoRow[]> {
  const { data: rows, error } = await admin
    .from("programmatic_seo_pages")
    .select("path, created_at, updated_at, seo_keywords(is_blacklisted, review_status, quality_score, revenue_score)");
  if (error || !rows?.length) return [];
  const out: IndexablePseoRow[] = [];
  for (const row of rows) {
    const kw = row.seo_keywords as Record<string, unknown> | Record<string, unknown>[] | null;
    const k = (Array.isArray(kw) ? kw[0] : kw) as SeoKeywordRow | null | undefined;
    if (!k || !isKeywordIndexable(k, thresholds)) continue;
    const lm = (row.updated_at as string) || (row.created_at as string) || new Date().toISOString();
    out.push({ path: row.path as string, lastmod: lm });
  }
  out.sort((a, b) => a.path.localeCompare(b.path));
  return out;
}

export async function getPseoHealthSnapshot(
  admin: SupabaseClient,
  thresholds = DEFAULT_INDEX_THRESHOLDS
): Promise<PseoHealthSnapshot> {
  const { count: seoKeywordCount } = await admin.from("seo_keywords").select("id", { count: "exact", head: true });
  const { data: pages } = await admin
    .from("programmatic_seo_pages")
    .select("id, seo_keywords(is_blacklisted, review_status, quality_score, revenue_score)");
  const programmaticPageCount = pages?.length ?? 0;
  let indexableProgrammaticCount = 0;
  for (const row of pages ?? []) {
    const kw = row.seo_keywords as Record<string, unknown> | Record<string, unknown>[] | null;
    const k = (Array.isArray(kw) ? kw[0] : kw) as SeoKeywordRow | null | undefined;
    if (k && isKeywordIndexable(k, thresholds)) indexableProgrammaticCount++;
  }
  const { data: kws } = await admin
    .from("seo_keywords")
    .select("quality_score, is_blacklisted, review_status, revenue_score");
  let lowQualityKeywordCount = 0;
  let blacklistedKeywordCount = 0;
  let pendingReviewKeywordCount = 0;
  for (const k of kws ?? []) {
    if (k.is_blacklisted) blacklistedKeywordCount++;
    if (k.review_status === "pending") pendingReviewKeywordCount++;
    if (
      Number(k.quality_score) < thresholds.minQualityScore ||
      Number(k.revenue_score) < thresholds.minRevenueScore
    ) {
      lowQualityKeywordCount++;
    }
  }
  return {
    seoKeywordCount: seoKeywordCount ?? 0,
    programmaticPageCount,
    indexableProgrammaticCount,
    filteredProgrammaticCount: Math.max(0, programmaticPageCount - indexableProgrammaticCount),
    lowQualityKeywordCount,
    blacklistedKeywordCount,
    pendingReviewKeywordCount
  };
}
