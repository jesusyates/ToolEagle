import { NextResponse } from "next/server";
import { BASE_URL, sitemapToXml } from "@/lib/sitemap-data";
import { getAllCompareSlugs } from "@/config/compare-pages";
import { getAllComparePairSlugs } from "@/lib/generate-comparisons";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export async function GET() {
  try {
    const now = new Date();
    const legacy = getAllCompareSlugs();
    const pairs = getAllComparePairSlugs();
    const allSlugs = [...new Set([...legacy, ...pairs])];

    const urls = allSlugs.map((slug) => ({
      url: `${BASE_URL}/compare/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.75
    }));

    const xml = sitemapToXml(urls);
    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600"
      }
    });
  } catch (err) {
    console.error("[sitemap-compare]", err);
    return new NextResponse("Sitemap temporarily unavailable", { status: 500 });
  }
}
