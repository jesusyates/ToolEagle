/**
 * V93 / V93.1: Register programmatic SEO pages with quality + locale guardrails
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { allowProgrammaticSeoWrite } from "@/lib/seo-write-auth";
import {
  evaluateKeywordForGeneration,
  pathForProgrammaticPage,
  syncSeoKeywordsFromSignals,
  type ProgrammaticPageType,
  type PseoLocale,
  type GenerationSkipReason
} from "@/lib/programmatic-seo";

export const dynamic = "force-dynamic";

const TYPES: ProgrammaticPageType[] = ["ai_generator", "examples", "how_to"];

export async function POST(request: NextRequest) {
  try {
    if (!(await allowProgrammaticSeoWrite(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const limit = Math.min(100, Math.max(1, parseInt(String(body.limit ?? 20), 10)));
    const dryRun = Boolean(body.dryRun);
    const refreshKeywords = body.refreshKeywords !== false;
    const minRevenueScore = Math.max(0, Number(body.minRevenueScore ?? 0.01));
    const minQualityScore = Math.max(0, Math.min(1, Number(body.minQualityScore ?? 0.25)));
    const locale: PseoLocale = body.locale === "zh" ? "zh" : "en";
    const reviewStatusRaw = String(body.reviewStatus ?? "approved").toLowerCase();
    const reviewStatus =
      reviewStatusRaw === "pending" || reviewStatusRaw === "any" ? reviewStatusRaw : "approved";

    const admin = createAdminClient();

    if (refreshKeywords) {
      await syncSeoKeywordsFromSignals(admin);
    }

    const { count } = await admin.from("seo_keywords").select("id", { count: "exact", head: true });
    if ((count ?? 0) === 0) {
      await syncSeoKeywordsFromSignals(admin);
    }

    const { data: keywords, error: kwErr } = await admin
      .from("seo_keywords")
      .select(
        "id, slug, keyword, revenue_score, locale, is_blacklisted, quality_score, review_status"
      )
      .eq("locale", locale)
      .order("revenue_score", { ascending: false })
      .limit(limit * 3);

    if (kwErr) {
      console.error("[seo/generate-pages]", kwErr);
      return NextResponse.json({ error: "Failed to read keywords" }, { status: 500 });
    }

    const created: { path: string; page_type: string }[] = [];
    const skippedDetail: { slug: string; reason: GenerationSkipReason }[] = [];

    const reviewFilter =
      reviewStatus === "any"
        ? ("any" as const)
        : reviewStatus === "pending"
          ? ("pending" as const)
          : ("approved" as const);

    const candidates = (keywords ?? []).filter((k) => {
      const ev = evaluateKeywordForGeneration(
        {
          slug: k.slug as string,
          keyword: k.keyword as string,
          revenue_score: Number(k.revenue_score),
          quality_score: Number(k.quality_score ?? 0.5),
          is_blacklisted: Boolean(k.is_blacklisted),
          review_status: k.review_status as "pending" | "approved" | "rejected",
          locale: (k.locale === "zh" ? "zh" : "en") as PseoLocale
        },
        { minRevenueScore, minQualityScore, locale, reviewStatus: reviewFilter }
      );
      if (!ev.ok) {
        skippedDetail.push({ slug: k.slug as string, reason: ev.reason });
        return false;
      }
      return true;
    });

    const picked = candidates.slice(0, limit);

    if (!dryRun && picked.length > 0) {
      const rows: {
        seo_keyword_id: string;
        page_type: ProgrammaticPageType;
        slug: string;
        path: string;
        locale: PseoLocale;
        updated_at: string;
      }[] = [];
      const now = new Date().toISOString();

      for (const k of picked) {
        const id = k.id as string;
        const slug = k.slug as string;
        for (const pt of TYPES) {
          rows.push({
            seo_keyword_id: id,
            page_type: pt,
            slug,
            path: pathForProgrammaticPage(pt, slug, locale),
            locale,
            updated_at: now
          });
        }
      }

      const { error: insErr } = await admin.from("programmatic_seo_pages").upsert(rows, {
        onConflict: "page_type,slug,locale"
      });

      if (insErr) {
        console.error("[seo/generate-pages upsert]", insErr);
        return NextResponse.json({ error: "Failed to upsert pages", detail: insErr.message }, { status: 500 });
      }

      for (const r of rows) created.push({ path: r.path, page_type: r.page_type });
    } else if (dryRun && picked.length > 0) {
      for (const k of picked) {
        const slug = k.slug as string;
        for (const pt of TYPES) {
          created.push({ path: pathForProgrammaticPage(pt, slug, locale), page_type: pt });
        }
      }
    }

    const skippedByReason: Partial<Record<GenerationSkipReason, number>> = {};
    for (const s of skippedDetail) {
      skippedByReason[s.reason] = (skippedByReason[s.reason] ?? 0) + 1;
    }

    return NextResponse.json({
      ok: true,
      dryRun,
      locale,
      minRevenueScore,
      minQualityScore,
      reviewStatus: reviewFilter,
      keywordCandidatesScanned: keywords?.length ?? 0,
      keywordCountAfterFilters: picked.length,
      pagesTouched: created.length,
      paths: created.slice(0, 60),
      skippedCount: skippedDetail.length,
      skippedByReason,
      skippedSample: skippedDetail.slice(0, 40)
    });
  } catch (e) {
    console.error("[seo/generate-pages]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
