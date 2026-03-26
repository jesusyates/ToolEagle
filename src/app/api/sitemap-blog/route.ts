import { NextResponse } from "next/server";
import { blogUrls, sitemapToXml } from "@/lib/sitemap-data";

/** V106: Blog-only urlset — fresh lastmod + daily changefreq for MDX posts. */
export const dynamic = "force-dynamic";
export const revalidate = 600;

export async function GET() {
  try {
    const urls = await blogUrls();
    const xml = sitemapToXml(urls);
    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=600, s-maxage=600"
      }
    });
  } catch (err) {
    console.error("[sitemap-blog]", err);
    return new NextResponse("Sitemap temporarily unavailable", { status: 500 });
  }
}
