import { NextResponse } from "next/server";
import { answerUrls, sitemapToXml } from "@/lib/sitemap-data";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export async function GET() {
  const urls = answerUrls();
  const xml = sitemapToXml(urls);
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600"
    }
  });
}
