import { NextResponse } from "next/server";
import { BASE_URL, sitemapIndexXml } from "@/lib/sitemap-data";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const now = new Date();

export async function GET() {
  const sitemaps = [
    { loc: `${BASE_URL}/sitemap-main.xml`, lastmod: now },
    { loc: `${BASE_URL}/sitemap-topics.xml`, lastmod: now },
    { loc: `${BASE_URL}/sitemap-examples.xml`, lastmod: now },
    { loc: `${BASE_URL}/sitemap-ideas.xml`, lastmod: now },
    { loc: `${BASE_URL}/sitemap-library.xml`, lastmod: now },
    { loc: `${BASE_URL}/sitemap-answers.xml`, lastmod: now },
    { loc: `${BASE_URL}/sitemap-tools.xml`, lastmod: now }
  ];

  const xml = sitemapIndexXml(sitemaps);
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600"
    }
  });
}
