/**
 * V93 / V93.1: Quality filter + pseo health distribution
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { allowProgrammaticSeoWrite } from "@/lib/seo-write-auth";
import { DEFAULT_INDEX_THRESHOLDS, getPseoHealthSnapshot } from "@/lib/programmatic-seo";
import { inferHighRiskPseoTopic } from "@/lib/seo/pseo-content-safety";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    if (!(await allowProgrammaticSeoWrite(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const thresholds = DEFAULT_INDEX_THRESHOLDS;

    const { data: pages } = await admin.from("programmatic_seo_pages").select("id, path, slug, page_type, locale");
    const pathCount = new Map<string, number>();
    for (const p of pages ?? []) {
      const path = p.path as string;
      pathCount.set(path, (pathCount.get(path) ?? 0) + 1);
    }
    const duplicatePaths = [...pathCount.entries()].filter(([, n]) => n > 1).map(([path]) => path);

    const { data: kws } = await admin
      .from("seo_keywords")
      .select("id, keyword, slug, revenue_score, locale, quality_score, review_status, is_blacklisted");
    const emptyKeywords = (kws ?? [])
      .filter((k) => !String(k.keyword || "").trim() || String(k.keyword).trim().length < 2)
      .map((k) => k.id);

    const lowTraffic: string[] = [];
    for (const k of kws ?? []) {
      const score = Number(k.revenue_score ?? 0);
      if (score < 0.01) lowTraffic.push(k.slug as string);
    }

    const programmaticPageCount = pages?.length ?? 0;
    const internalLinkListSlotsApprox = programmaticPageCount * 12;

    const health = await getPseoHealthSnapshot(admin, thresholds);

    const reviewDistribution = { pending: 0, approved: 0, rejected: 0 };
    const highRiskSlugs: string[] = [];
    for (const k of kws ?? []) {
      const r = k.review_status as string;
      if (r === "pending") reviewDistribution.pending++;
      else if (r === "rejected") reviewDistribution.rejected++;
      else reviewDistribution.approved++;
      if (inferHighRiskPseoTopic(String(k.keyword ?? ""))) {
        highRiskSlugs.push(String(k.slug ?? ""));
      }
    }

    return NextResponse.json({
      duplicatePaths,
      emptyKeywordIds: emptyKeywords,
      lowRevenueSlugCount: lowTraffic.length,
      lowRevenueSlugsSample: lowTraffic.slice(0, 30),
      programmaticPageCount,
      seoKeywordCount: kws?.length ?? 0,
      internalLinkListSlotsApprox,
      thresholds,
      health,
      reviewDistribution,
      highRiskTopicKeywordCount: highRiskSlugs.length,
      highRiskTopicSlugsSample: highRiskSlugs.slice(0, 40),
      generationFilterNote:
        "Default generate-pages uses minRevenueScore=0.01, minQualityScore=0.25, reviewStatus=approved, locale=en",
      v104_1:
        "pSEO copy follows V104.1: advisory tone, compliance buffer lines, combinedProgrammaticQualityScore on keyword sync"
    });
  } catch (e) {
    console.error("[seo/quality-check]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
