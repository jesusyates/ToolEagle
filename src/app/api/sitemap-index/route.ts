import { NextResponse } from "next/server";
import { BASE_URL, MAX_URLS_PER_SITEMAP, sitemapIndexXml } from "@/lib/sitemap-data";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchIndexablePseoPathsForSitemap, DEFAULT_INDEX_THRESHOLDS } from "@/lib/programmatic-seo";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const STATIC_SITEMAPS = [
  "sitemap-main.xml",
  "sitemap-blog.xml",
  "sitemap-topics.xml",
  "sitemap-examples.xml",
  "sitemap-prompts.xml",
  "sitemap-ideas.xml",
  "sitemap-library.xml",
  "sitemap-answers.xml",
  "sitemap-ai-tools.xml",
  "sitemap-tools.xml",
  "sitemap-compare.xml",
  "sitemap-community.xml",
  "sitemap-guides.xml",
  "sitemap-zh.xml",
  "sitemap-ai.xml",
  "sitemap-en.xml",
  "sitemap-questions.xml"
] as const;

export async function GET() {
  try {
    const now = new Date();
    const sitemaps = STATIC_SITEMAPS.map((p) => ({
      loc: `${BASE_URL}/${p}`,
      lastmod: now
    }));

    try {
      const admin = createAdminClient();
      const indexable = await fetchIndexablePseoPathsForSitemap(admin, DEFAULT_INDEX_THRESHOLDS);
      const total = indexable.length;
      if (total > 0) {
        const chunks = Math.ceil(total / MAX_URLS_PER_SITEMAP);
        for (let i = 0; i < chunks; i++) {
          sitemaps.push({
            loc: `${BASE_URL}/sitemap-pseo-${i}.xml`,
            lastmod: now
          });
        }
      }
    } catch (e) {
      console.warn("[sitemap-index] programmatic chunk skipped", e);
    }

    const xml = sitemapIndexXml(sitemaps);
    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600"
      }
    });
  } catch (err) {
    console.error("[sitemap-index]", err);
    return new NextResponse("Sitemap temporarily unavailable", { status: 500 });
  }
}
