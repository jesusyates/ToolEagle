/**
 * V91/V92 Traffic Injection: top money pages + keywords.
 * V92: injection_weight ordering, locale variants, A/B, Redis/memory cache.
 */

import { BASE_URL } from "@/config/site";
import { getLatestKeywordPages } from "@/lib/zh-keyword-data";
import { getKeywordContent } from "@/lib/zh-keyword-content";
import { getAllEnHowToSlugs, getEnHowToContent } from "@/lib/en-how-to-content";
import {
  trafficInjectionCacheGet,
  trafficInjectionCacheSet,
  getTrafficInjectionCacheBackend
} from "@/lib/traffic-injection-cache";

export type InjectionLocale = "zh" | "en";
export type InjectionVariant = "a" | "b";

export type InjectionMoneyPage = {
  slug: string;
  title: string;
  titleZh: string;
  titleEn: string;
  href: string;
  pageType: "zh-search" | "en-how-to";
  keyword: string;
  injectionWeight: number;
};

export type InjectionMoneyKeyword = {
  keyword: string;
  slug: string;
  href: string;
};

export type TrafficInjectionPayload = {
  pages: InjectionMoneyPage[];
  keywords: InjectionMoneyKeyword[];
  source: "db" | "fallback";
  locale: InjectionLocale;
  variant: InjectionVariant;
  cacheBackend: "redis" | "memory";
};

function dedupeBySlug(pages: InjectionMoneyPage[]): InjectionMoneyPage[] {
  const seen = new Set<string>();
  const out: InjectionMoneyPage[] = [];
  for (const p of pages) {
    const k = `${p.pageType}:${p.slug}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(p);
  }
  return out;
}

function scorePage(p: InjectionMoneyPage, revenue: number): number {
  return p.injectionWeight * (Number(revenue) || 0) + p.injectionWeight * 0.01;
}

function stableHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function applyVariantOrder(pages: InjectionMoneyPage[], variant: InjectionVariant): InjectionMoneyPage[] {
  if (variant !== "b" || pages.length < 4) return pages;
  const head = pages.slice(0, 2);
  const tail = pages.slice(2);
  tail.sort((a, b) => stableHash(a.slug) - stableHash(b.slug));
  return [...head, ...tail];
}

function resolveTitles(slug: string, keyword: string, pageType: "zh-search" | "en-how-to") {
  if (pageType === "en-how-to") {
    const en = getEnHowToContent(slug);
    const t = en?.title ?? slug;
    const zh = getKeywordContent(slug);
    const zhT = zh?.h1 || zh?.title || keyword || t;
    return { titleZh: zhT, titleEn: t };
  }
  const zh = getKeywordContent(slug);
  const zhT = zh?.h1 || zh?.title || keyword;
  const en = getEnHowToContent(slug);
  const enT = en?.title || zhT;
  return { titleZh: zhT, titleEn: enT };
}

function buildPage(
  slug: string,
  kw: string,
  pageType: "zh-search" | "en-how-to",
  weight: number,
  _revenue: number
): InjectionMoneyPage | null {
  const href =
    pageType === "en-how-to"
      ? `${BASE_URL}/en/how-to/${slug}`
      : `${BASE_URL}/zh/search/${slug}`;
  if (pageType === "en-how-to" && !getEnHowToContent(slug)) return null;
  const { titleZh, titleEn } = resolveTitles(slug, kw, pageType);
  return {
    slug,
    title: titleZh,
    titleZh,
    titleEn,
    href,
    pageType,
    keyword: kw,
    injectionWeight: weight
  };
}

type ZhRevenueMetricRow = {
  page_slug: string | null;
  page_type?: string | null;
  keyword?: string | null;
  estimated_revenue?: number | null;
  injection_weight?: number | null;
};

async function loadPayload(
  locale: InjectionLocale,
  variant: InjectionVariant
): Promise<Omit<TrafficInjectionPayload, "cacheBackend">> {
  const raw: InjectionMoneyPage[] = [];
  const revenueByKey = new Map<string, number>();
  let source: "db" | "fallback" = "fallback";

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    const resWeighted = await admin
      .from("zh_page_revenue_metrics")
      .select("page_slug, page_type, keyword, estimated_revenue, injection_weight")
      .order("estimated_revenue", { ascending: false })
      .limit(40);
    let rows: ZhRevenueMetricRow[] = (resWeighted.data ?? []) as ZhRevenueMetricRow[];
    if (resWeighted.error) {
      const fb = await admin
        .from("zh_page_revenue_metrics")
        .select("page_slug, page_type, keyword, estimated_revenue")
        .order("estimated_revenue", { ascending: false })
        .limit(40);
      rows = ((fb.data ?? []) as ZhRevenueMetricRow[]).map((r) => ({
        ...r,
        injection_weight: r.injection_weight ?? 1
      }));
    }

    if (rows && rows.length > 0) {
      source = "db";
      type Agg = { slug: string; kw: string; pt: "zh-search" | "en-how-to"; maxW: number; sumRev: number };
      const aggs = new Map<string, Agg>();
      for (const r of rows) {
        const slug = r.page_slug as string | null;
        if (!slug) continue;
        const kw = (r.keyword as string) || slug;
        const pt = ((r.page_type as string) || "") === "en-how-to" ? "en-how-to" : "zh-search";
        const w = Number((r as { injection_weight?: number }).injection_weight ?? 1) || 1;
        const rev = Number((r as { estimated_revenue?: number }).estimated_revenue ?? 0);
        const key = `${pt}:${slug}`;
        revenueByKey.set(key, (revenueByKey.get(key) ?? 0) + rev);
        const cur = aggs.get(key);
        if (cur) {
          cur.maxW = Math.max(cur.maxW, w);
          cur.sumRev += rev;
        } else {
          aggs.set(key, { slug, kw, pt, maxW: w, sumRev: rev });
        }
      }
      for (const a of aggs.values()) {
        const page = buildPage(a.slug, a.kw, a.pt, a.maxW, a.sumRev);
        if (page) raw.push(page);
      }
    }
  } catch {
    // missing env
  }

  if (raw.length < 3) {
    for (const k of getLatestKeywordPages(15)) {
      const p = buildPage(k.slug, k.keyword, "zh-search", 1, 0);
      if (p) raw.push(p);
    }
    /** 中文流量注入只补英文 how-to 当 locale 为 en；zh 分发包应只含 `/zh/search/*`，避免标题混用 Instagram 等英文教程名 */
    if (locale !== "zh") {
      for (const slug of getAllEnHowToSlugs().slice(0, 10)) {
        const p = buildPage(slug, slug, "en-how-to", 1, 0);
        if (p) raw.push(p);
      }
    }
    source = "fallback";
  }

  const deduped = dedupeBySlug(raw);
  deduped.sort((a, b) => {
    const ra = revenueByKey.get(`${a.pageType}:${a.slug}`) ?? 0;
    const rb = revenueByKey.get(`${b.pageType}:${b.slug}`) ?? 0;
    const sa = scorePage(a, ra);
    const sb = scorePage(b, rb);
    if (sb !== sa) return sb - sa;
    return rb - ra;
  });

  /** 中文站：分发包 / 注入只展示中文关键词页，不把 `/en/how-to/*` 混进「高优先级」列表（避免英文教程标题） */
  let ranked = deduped;
  if (locale === "zh") {
    let zhPages = deduped.filter((p) => p.pageType === "zh-search");
    if (zhPages.length < 3) {
      const seen = new Set(zhPages.map((p) => p.slug));
      for (const k of getLatestKeywordPages(50)) {
        if (zhPages.length >= 24) break;
        if (seen.has(k.slug)) continue;
        const p = buildPage(k.slug, k.keyword, "zh-search", 1, 0);
        if (p) {
          zhPages.push(p);
          seen.add(k.slug);
        }
      }
      zhPages.sort((a, b) => {
        const ra = revenueByKey.get(`${a.pageType}:${a.slug}`) ?? 0;
        const rb = revenueByKey.get(`${b.pageType}:${b.slug}`) ?? 0;
        const sa = scorePage(a, ra);
        const sb = scorePage(b, rb);
        if (sb !== sa) return sb - sa;
        return rb - ra;
      });
    }
    ranked = zhPages.length >= 3 ? zhPages : deduped;
  }

  const ordered = applyVariantOrder(ranked, variant).slice(0, 16);

  const pages: InjectionMoneyPage[] = ordered.map((p) => {
    const displayTitle = locale === "en" ? p.titleEn : p.titleZh;
    return { ...p, title: displayTitle };
  });

  const keywords: InjectionMoneyKeyword[] = pages.slice(0, 6).map((p) => ({
    keyword: p.keyword,
    slug: p.slug,
    href: p.href
  }));

  return { pages, keywords, source, locale, variant };
}

export async function getTrafficInjectionContext(options?: {
  locale?: InjectionLocale;
  variant?: InjectionVariant;
  skipCache?: boolean;
}): Promise<TrafficInjectionPayload> {
  const locale = options?.locale ?? "zh";
  const variant = options?.variant ?? "a";
  const cacheKey = `traffic-injection:v92:${locale}:${variant}`;

  if (!options?.skipCache) {
    const cached = await trafficInjectionCacheGet(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as TrafficInjectionPayload;
        return { ...parsed, cacheBackend: getTrafficInjectionCacheBackend() };
      } catch {
        /* fall through */
      }
    }
  }

  const payload = await loadPayload(locale, variant);
  const full: TrafficInjectionPayload = {
    ...payload,
    cacheBackend: getTrafficInjectionCacheBackend()
  };

  if (!options?.skipCache) {
    const { cacheBackend: _b, ...toStore } = full;
    await trafficInjectionCacheSet(cacheKey, JSON.stringify({ ...toStore, cacheBackend: full.cacheBackend }));
  }

  return full;
}

export function getPrimaryMoneyPage(pages: InjectionMoneyPage[]): InjectionMoneyPage | null {
  return pages[0] ?? null;
}
