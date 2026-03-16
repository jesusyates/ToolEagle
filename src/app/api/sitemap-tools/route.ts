import { NextResponse } from "next/server";
import { BASE_URL, sitemapToXml } from "@/lib/sitemap-data";
import {
  getAllAIToolSlugs,
  AI_TOOL_CATEGORIES,
  BEST_AI_TOOLS_CATEGORIES
} from "@/config/ai-tools-marketplace";
import { getAllCompareSlugs } from "@/config/compare-pages";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export async function GET() {
  try {
    const now = new Date();
    const urls = [
    { url: `${BASE_URL}/ai-tools`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.9 },
    ...getAllAIToolSlugs().map((slug) => ({
      url: `${BASE_URL}/ai-tools/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.75
    })),
    ...AI_TOOL_CATEGORIES.map((c) => ({
      url: `${BASE_URL}/ai-tools/category/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8
    })),
    ...BEST_AI_TOOLS_CATEGORIES.map((slug) => ({
      url: `${BASE_URL}/best-ai-tools/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8
    })),
    { url: `${BASE_URL}/compare`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.85 },
    ...getAllCompareSlugs().map((slug) => ({
      url: `${BASE_URL}/compare/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.75
    }))
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
