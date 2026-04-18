import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/isAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchSeoArticlesCorpus, runGapAwareTopicEngine } from "@/lib/seo/gap-topic-engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let wanted = 50;
  let jaccardThreshold = 0.92;
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    if (typeof body.wanted === "number" && Number.isFinite(body.wanted)) {
      wanted = Math.max(1, Math.min(200, Math.floor(body.wanted)));
    }
    if (typeof body.jaccardThreshold === "number" && Number.isFinite(body.jaccardThreshold)) {
      jaccardThreshold = Math.max(0.8, Math.min(0.99, body.jaccardThreshold));
    }
  } catch {
    /* defaults */
  }

  try {
    const db = createAdminClient();
    const articles = await fetchSeoArticlesCorpus(db);
    const plan = runGapAwareTopicEngine({ wanted, articles, jaccardThreshold });
    return NextResponse.json({
      ok: true,
      articleCount: articles.length,
      keywordCount: plan.keywords.length,
      coverage: plan.coverage,
      keywords: plan.keywords,
      preflightCandidateRows: plan.preflightCandidateRows
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
