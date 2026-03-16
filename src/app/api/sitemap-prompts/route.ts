import { NextResponse } from "next/server";
import { promptsUrls, sitemapToXml } from "@/lib/sitemap-data";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export async function GET() {
  try {
    const urls = await promptsUrls();
    const xml = sitemapToXml(urls);
    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600"
      }
    });
  } catch (err) {
    console.error("[sitemap-prompts]", err);
    return new NextResponse("Sitemap temporarily unavailable", { status: 500 });
  }
}
