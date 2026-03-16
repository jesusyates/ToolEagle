import { NextResponse } from "next/server";
import { BASE_URL, sitemapIndexXml } from "@/lib/sitemap-data";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const now = new Date();

const SITEMAPS = [
  { loc: `${BASE_URL}/sitemap-main.xml`, lastmod: now },
  { loc: `${BASE_URL}/sitemap-topics.xml`, lastmod: now },
  { loc: `${BASE_URL}/sitemap-examples.xml`, lastmod: now },
  { loc: `${BASE_URL}/sitemap-ideas.xml`, lastmod: now },
  { loc: `${BASE_URL}/sitemap-library.xml`, lastmod: now },
  { loc: `${BASE_URL}/sitemap-answers.xml`, lastmod: now },
  { loc: `${BASE_URL}/sitemap-tools.xml`, lastmod: now }
];

export async function GET() {
  try {
    const xml = sitemapIndexXml(SITEMAPS);
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
