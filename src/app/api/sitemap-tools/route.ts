import { NextResponse } from "next/server";
import { BASE_URL, catalogToolPageUrls, sitemapToXml } from "@/lib/sitemap-data";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export async function GET() {
  try {
    const now = new Date();
    const urls = [
      ...catalogToolPageUrls(),
      { url: `${BASE_URL}/compare`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.85 }
    ];
    const xml = sitemapToXml(urls);
    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600"
      }
    });
  } catch (err) {
    console.error("[sitemap-tools]", err);
    return new NextResponse("Sitemap temporarily unavailable", { status: 500 });
  }
}
