import { NextResponse } from "next/server";
import { getZhContent, getAllZhGuideParams } from "@/lib/generate-zh-content";
import { getAllHubParams, ZH_BASE_PATHS } from "@/lib/zh-hub-data";
import { sitemapToXml } from "@/lib/sitemap-data";
import { BASE_URL } from "@/config/site";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export async function GET() {
  try {
    const params = getAllZhGuideParams();
    const hubParams = getAllHubParams();
    const now = new Date();

    const childUrls = params
      .filter(({ pageType, topic }) => getZhContent(pageType, topic))
      .map(({ pageType, topic }) => ({
        url: `${BASE_URL}${ZH_BASE_PATHS[pageType]}/${topic}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.75
      }));

    const hubUrls = hubParams.map(({ pageType, platform }) => ({
      url: `${BASE_URL}${ZH_BASE_PATHS[pageType]}/${platform}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85
    }));

    const urls = [...hubUrls, ...childUrls];
    const xml = sitemapToXml(urls);

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600"
      }
    });
  } catch (err) {
    console.error("[sitemap-zh]", err);
    return new NextResponse("Sitemap temporarily unavailable", { status: 500 });
  }
}
