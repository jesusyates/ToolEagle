import { NextResponse } from "next/server";
import { ideasUrls, generatedIdeaDetailUrls, sitemapToXml } from "@/lib/sitemap-data";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export async function GET() {
  try {
    const [staticUrls, generatedUrls] = await Promise.all([
      Promise.resolve(ideasUrls()),
      generatedIdeaDetailUrls()
    ]);
    const urls = [...staticUrls, ...generatedUrls];
    const xml = sitemapToXml(urls);
    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600"
      }
    });
  } catch (err) {
    console.error("[sitemap-ideas]", err);
    return new NextResponse("Sitemap temporarily unavailable", { status: 500 });
  }
}
