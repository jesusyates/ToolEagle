import { NextResponse } from "next/server";
import { BASE_URL, sitemapIndexXml } from "@/lib/sitemap-data";

/**
 * Primary sitemap index (standard entry). Lists zh + programmatic urlsets only.
 * Full discovery remains at GET /api/sitemap-index (unchanged).
 */
export const dynamic = "force-dynamic";
export const revalidate = 3600;

export async function GET() {
  const now = new Date();
  const xml = sitemapIndexXml([
    { loc: `${BASE_URL}/sitemap-zh.xml`, lastmod: now },
    { loc: `${BASE_URL}/sitemap-programmatic.xml`, lastmod: now }
  ]);
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600"
    }
  });
}
