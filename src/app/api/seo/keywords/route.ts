/**
 * V93: SEO keywords engine — backed by seo_keywords + optional refresh from attribution/traffic
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { allowProgrammaticSeoWrite } from "@/lib/seo-write-auth";
import { syncSeoKeywordsFromSignals } from "@/lib/programmatic-seo";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

    const { data, error } = await admin
      .from("seo_keywords")
      .select(
        "id, keyword, slug, source, revenue_score, created_at, updated_at, locale, is_blacklisted, quality_score, review_status"
      )
      .order("revenue_score", { ascending: false })
      .limit(limit);

    if (error) {
      if (error.message?.includes("relation") || error.code === "42P01") {
        return NextResponse.json({ keywords: [], note: "Run migration 0028_v93" });
      }
      if (error.code === "42703" || error.message?.includes("does not exist")) {
        const { data: legacy, error: e2 } = await admin
          .from("seo_keywords")
          .select("id, keyword, slug, source, revenue_score, created_at, updated_at")
          .order("revenue_score", { ascending: false })
          .limit(limit);
        if (e2) {
          console.error("[seo/keywords GET]", error);
          return NextResponse.json({ error: "Failed to load" }, { status: 500 });
        }
        return NextResponse.json({
          keywords: legacy ?? [],
          count: (legacy ?? []).length,
          note: "Run migration 0029_v93_1 for locale/quality columns"
        });
      }
      console.error("[seo/keywords GET]", error);
      return NextResponse.json({ error: "Failed to load" }, { status: 500 });
    }

    return NextResponse.json({ keywords: data ?? [], count: (data ?? []).length });
  } catch (e) {
    console.error("[seo/keywords GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await allowProgrammaticSeoWrite(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    if (body.action !== "refresh") {
      return NextResponse.json({ error: 'Use { "action": "refresh" }' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { upserted } = await syncSeoKeywordsFromSignals(admin);

    const { data: top } = await admin
      .from("seo_keywords")
      .select("keyword, slug, revenue_score, source")
      .order("revenue_score", { ascending: false })
      .limit(20);

    return NextResponse.json({ ok: true, upserted, sample: top ?? [] });
  } catch (e) {
    console.error("[seo/keywords POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
