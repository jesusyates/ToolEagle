import { NextResponse } from "next/server";
import { getZhContent, getAllZhGuideParams } from "@/lib/generate-zh-content";
import { getAllHubParams, ZH_BASE_PATHS } from "@/lib/zh-hub-data";
import { getAllKeywordSlugsWithContent } from "@/lib/zh-keyword-content";
import { getKeywordLastModifiedMap } from "@/lib/zh-keyword-data";
import { sitemapToXml } from "@/lib/sitemap-data";
import { BASE_URL } from "@/config/site";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export async function GET() {
  try {
    const params = getAllZhGuideParams();
    const hubParams = getAllHubParams();
    const keywordSlugs = getAllKeywordSlugsWithContent();
    const lastModMap = getKeywordLastModifiedMap();
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

    const platformHubUrls = ["tiktok", "youtube", "instagram"].map((platform) => ({
      url: `${BASE_URL}/zh/${platform}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85
    }));

    const zhStaticUrls = [
      { url: `${BASE_URL}/zh/recent`, lastModified: now, changeFrequency: "daily" as const, priority: 0.9 },
      { url: `${BASE_URL}/zh/sitemap`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.9 },
      { url: `${BASE_URL}/zh/blog`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.85 }
    ];

    const keywordUrls = keywordSlugs.map((slug) => ({
      url: `${BASE_URL}/zh/search/${slug}`,
      lastModified: new Date(lastModMap[slug] ?? Date.now()),
      changeFrequency: "weekly" as const,
      priority: 0.8
    }));

    const blogUrls = keywordSlugs.map((slug) => ({
      url: `${BASE_URL}/zh/blog/${slug}`,
      lastModified: new Date(lastModMap[slug] ?? Date.now()),
      changeFrequency: "weekly" as const,
      priority: 0.75
    }));

    const urls = [...hubUrls, ...platformHubUrls, ...zhStaticUrls, ...childUrls, ...keywordUrls, ...blogUrls];
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
