/**
 * V93 / V93.1: Sitemap manifest — indexable programmatic chunks only
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BASE_URL, MAX_URLS_PER_SITEMAP } from "@/lib/sitemap-data";
import { fetchIndexablePseoPathsForSitemap, DEFAULT_INDEX_THRESHOLDS } from "@/lib/programmatic-seo";

export const dynamic = "force-dynamic";

const STATIC_SITEMAPS = [
  "sitemap-main.xml",
  "sitemap-topics.xml",
  "sitemap-examples.xml",
  "sitemap-prompts.xml",
  "sitemap-ideas.xml",
  "sitemap-library.xml",
  "sitemap-answers.xml",
  "sitemap-ai-tools.xml",
  "sitemap-tools.xml",
  "sitemap-compare.xml",
  "sitemap-community.xml",
  "sitemap-guides.xml",
  "sitemap-zh.xml",
  "sitemap-ai.xml",
  "sitemap-en.xml",
  "sitemap-questions.xml"
] as const;

export async function GET() {
  try {
    const admin = createAdminClient();
    const indexable = await fetchIndexablePseoPathsForSitemap(admin, DEFAULT_INDEX_THRESHOLDS);
    const programmaticTotal = indexable.length;
    const programmaticChunks =
      programmaticTotal === 0 ? 0 : Math.ceil(programmaticTotal / MAX_URLS_PER_SITEMAP);

    const programmaticFiles = Array.from({ length: programmaticChunks }, (_, i) => ({
      part: i,
      path: `/sitemap-pseo-${i}.xml`,
      api: `/api/sitemap-programmatic?part=${i}`,
      estimatedUrls: Math.min(MAX_URLS_PER_SITEMAP, programmaticTotal - i * MAX_URLS_PER_SITEMAP)
    }));

    return NextResponse.json({
      ok: true,
      baseUrl: BASE_URL,
      indexUrl: `${BASE_URL}/sitemap.xml`,
      staticSitemaps: STATIC_SITEMAPS.map((p) => ({
        path: `/${p}`,
        loc: `${BASE_URL}/${p}`
      })),
      programmatic: {
        indexableOnly: true,
        thresholds: DEFAULT_INDEX_THRESHOLDS,
        totalUrls: programmaticTotal,
        maxPerFile: MAX_URLS_PER_SITEMAP,
        chunkCount: programmaticChunks,
        files: programmaticFiles,
        alias: { path: "/sitemap-pseo.xml", note: "Same as part 0 when chunks >= 1" }
      },
      note: "Programmatic sitemap lists only indexable pages (approved, non-blacklisted, above quality/revenue floors)."
    });
  } catch (e) {
    console.error("[sitemap/generate]", e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
