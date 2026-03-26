import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { google } from "googleapis";
import { submitUrlToGoogleIndexing } from "@/lib/google-indexing-submit";
import { getAllSeoParams } from "@/config/seo/index";
import { tools } from "@/config/tools";
import { getAllAnswerSlugs } from "@/config/answers";
import { getAllTrendingSlugs } from "@/config/trending";
import { getAllCompareSlugs } from "@/config/compare-pages";
import { getAllExampleCategorySlugs } from "@/config/example-categories";
import { getAllLearnAiSlugs } from "@/config/learn-ai";
import { getSeoPageSlugs } from "@/config/seoPages";
import { getSeoPageParams } from "@/config/seo-pages";
import { PROMPT_CATEGORIES } from "@/config/prompt-library";
import { BACKLINK_MAGNETS } from "@/config/backlink-magnets";
import { BASE_URL } from "@/config/site";

function getTotalPagesEstimate(): number {
  const staticCount = 50;
  const seoCount = getAllSeoParams().length;
  const toolCount = tools.filter((t) => t.slug).length;
  const answerCount = getAllAnswerSlugs().length;
  const trendingCount = getAllTrendingSlugs().length + 1;
  const compareCount = getAllCompareSlugs().length + 1;
  const exampleCategoryCount = getAllExampleCategorySlugs().length;
  const learnCount = getAllLearnAiSlugs().length + 1;
  const seoPageCount = getSeoPageParams?.()?.length ?? 0;
  const promptCount = PROMPT_CATEGORIES.length;
  const backlinkCount = BACKLINK_MAGNETS.length;
  return (
    staticCount +
    seoCount +
    toolCount +
    answerCount +
    trendingCount +
    compareCount +
    exampleCategoryCount +
    learnCount +
    (getSeoPageSlugs()?.length ?? 0) +
    seoPageCount +
    promptCount +
    backlinkCount
  );
}

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const totalPages = getTotalPagesEstimate();

  const clientEmail = process.env.GSC_CLIENT_EMAIL;
  const privateKey = process.env.GSC_PRIVATE_KEY?.replace(/\\n/g, "\n");

  let indexedPages: number | undefined;
  let latestCrawled: string[] = [];
  let error: string | undefined;

  if (clientEmail && privateKey) {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: { client_email: clientEmail, private_key: privateKey },
        scopes: ["https://www.googleapis.com/auth/webmasters.readonly"]
      });
      const searchconsole = google.searchconsole({ version: "v1", auth });
      const siteUrl = process.env.GSC_SITE_URL ?? `${BASE_URL}/`;

      const sitemapsRes = await searchconsole.sitemaps.list({ siteUrl }).catch(() => ({ data: {} }));
      const sitemaps = (sitemapsRes.data as any)?.sitemap;
      if (Array.isArray(sitemaps) && sitemaps.length > 0) {
        indexedPages = sitemaps.reduce((sum: number, s: any) => sum + (s.contents?.[0]?.indexed ?? 0), 0);
      }
    } catch (err: any) {
      error = err?.message ?? "GSC fetch failed";
    }
  } else {
    error = "GSC credentials not configured";
  }

  return NextResponse.json({
    totalPages,
    indexedPages: indexedPages ?? 0,
    nonIndexedPages: indexedPages != null ? Math.max(0, totalPages - indexedPages) : null,
    latestCrawled,
    error
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const url = typeof body.url === "string" ? body.url.trim() : "";

  if (!url || !url.startsWith("http")) {
    return NextResponse.json({ error: "Valid URL required" }, { status: 400 });
  }

  const clientEmail = process.env.GSC_CLIENT_EMAIL;
  const privateKey = process.env.GSC_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    return NextResponse.json({ error: "Indexing API not configured" }, { status: 503 });
  }

  try {
    const result = await submitUrlToGoogleIndexing(url);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ ok: true, message: "URL submitted to Indexing API" });
  } catch (err: any) {
    console.error("Indexing API error:", err);
    return NextResponse.json({
      error: err?.message ?? "Failed to submit URL. Ensure Indexing API is enabled and the service account has access."
    }, { status: 500 });
  }
}
