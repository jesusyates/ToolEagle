import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BASE_URL, MAX_URLS_PER_SITEMAP, sitemapToXml, type SitemapEntry } from "@/lib/sitemap-data";
import { fetchIndexablePseoPathsForSitemap, DEFAULT_INDEX_THRESHOLDS } from "@/lib/programmatic-seo";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export async function GET(request: NextRequest) {
  try {
    const part = Math.max(0, parseInt(request.nextUrl.searchParams.get("part") ?? "0", 10));
    const from = part * MAX_URLS_PER_SITEMAP;
    const to = from + MAX_URLS_PER_SITEMAP - 1;

    const admin = createAdminClient();
    const rows = await fetchIndexablePseoPathsForSitemap(admin, DEFAULT_INDEX_THRESHOLDS);
    const slice = rows.slice(from, to + 1);

    const entries: SitemapEntry[] = slice.map((r) => ({
      url: `${BASE_URL}${r.path}`,
      lastModified: new Date(r.lastmod),
      changeFrequency: "weekly" as const,
      priority: 0.65
    }));

    const xml = sitemapToXml(entries);
    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600"
      }
    });
  } catch (e) {
    console.error("[sitemap-programmatic]", e);
    return new NextResponse("Sitemap unavailable", { status: 500 });
  }
}
