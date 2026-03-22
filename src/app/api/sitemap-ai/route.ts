import { NextResponse } from "next/server";
import { getAiSitemapUrls, aiSitemapToXml } from "@/lib/ai-sitemap-data";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export async function GET() {
  try {
    const urls = getAiSitemapUrls();
    const xml = aiSitemapToXml(urls);
    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600"
      }
    });
  } catch (err) {
    console.error("[sitemap-ai]", err);
    return new NextResponse("Sitemap temporarily unavailable", { status: 500 });
  }
}
