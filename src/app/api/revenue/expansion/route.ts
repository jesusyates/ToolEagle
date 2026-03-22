/**
 * V87: Revenue expansion API - returns expansion candidates for top keywords
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isOperatorUser } from "@/lib/auth/operator";
import { expandWinningKeywords } from "@/lib/revenue-expansion";
import { getAllKeywordSlugsWithContent } from "@/lib/zh-keyword-content";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isOperatorUser(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const admin = createAdminClient();
    const { data: pageRows } = await admin
      .from("zh_page_revenue_metrics")
      .select("page_slug, page_type, keyword, clicks")
      .order("estimated_revenue", { ascending: false });

    const byPage = new Map<string, { slug: string; keyword: string; clicks: number }>();
    const byKeyword = new Map<string, { keyword: string; clicks: number }>();

    for (const r of pageRows ?? []) {
      const slug = r.page_slug ?? "";
      const cur = byPage.get(slug) ?? { slug, keyword: r.keyword ?? "", clicks: 0 };
      cur.clicks += r.clicks ?? 0;
      byPage.set(slug, cur);

      const kw = r.keyword || "";
      if (kw) {
        const kCur = byKeyword.get(kw) ?? { keyword: kw, clicks: 0 };
        kCur.clicks += r.clicks ?? 0;
        byKeyword.set(kw, kCur);
      }
    }

    const topKeywords = [...byKeyword.values()].sort((a, b) => b.clicks - a.clicks).slice(0, 3).map((k) => k.keyword);
    const topPages = [...byPage.values()].sort((a, b) => b.clicks - a.clicks).slice(0, 3);
    const topTools = ["ai-writing-1", "video-gen-1"];

    const existingSlugs = new Set(getAllKeywordSlugsWithContent());
    const { candidates } = expandWinningKeywords(topKeywords, topPages, topTools, { maxTotal: 200 });
    const newCandidates = candidates.filter((c) => !existingSlugs.has(c.slug));

    return NextResponse.json({
      inputKeywords: topKeywords,
      totalCandidates: candidates.length,
      newCandidates: newCandidates.length,
      existingCount: candidates.length - newCandidates.length,
      sample: newCandidates.slice(0, 20)
    });
  } catch (e) {
    console.error("[revenue/expansion]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
