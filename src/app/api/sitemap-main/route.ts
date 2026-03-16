import { NextResponse } from "next/server";
import {
  BASE_URL,
  staticAndToolUrls,
  blogUrls,
  creatorUrls,
  sitemapToXml
} from "@/lib/sitemap-data";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export async function GET() {
  try {
    const [blog, creators] = await Promise.all([blogUrls(), creatorUrls()]);
    const urls = [...staticAndToolUrls(), ...blog, ...creators];
    const xml = sitemapToXml(urls);
    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600"
      }
    });
  } catch (err) {
    console.error("[sitemap-main]", err);
    return new NextResponse("Sitemap temporarily unavailable", { status: 500 });
  }
}
