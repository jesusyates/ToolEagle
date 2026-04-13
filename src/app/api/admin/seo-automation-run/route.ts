import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/isAdmin";
import { runSeoAutomationPipeline } from "@/lib/seo-job-runner";
import type { SeoPreflightConfig, SeoPreflightContentType } from "@/lib/seo-preflight";
import fs from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CONTENT_TYPES: SeoPreflightContentType[] = ["guide", "how_to", "comparison", "listicle"];

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const p = path.join(process.cwd(), "generated", "seo-automation-last-run.json");
    const raw = await fs.readFile(p, "utf8");
    return NextResponse.json({ ok: true, lastRun: JSON.parse(raw) as unknown });
  } catch {
    return NextResponse.json({ ok: true, lastRun: null });
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const targetCount = Number(body.targetCount);
  if (!Number.isFinite(targetCount) || targetCount < 1 || targetCount > 500) {
    return NextResponse.json({ ok: false, error: "targetCount_invalid" }, { status: 400 });
  }
  const market = typeof body.market === "string" ? body.market.trim() : "";
  const locale = typeof body.locale === "string" ? body.locale.trim() : "";
  const contentLanguage = typeof body.contentLanguage === "string" ? body.contentLanguage.trim() : "";
  if (!market || !locale || !contentLanguage) {
    return NextResponse.json({ ok: false, error: "market_locale_language_required" }, { status: 400 });
  }
  const ct = typeof body.contentType === "string" ? body.contentType.trim() : "guide";
  if (!CONTENT_TYPES.includes(ct as SeoPreflightContentType)) {
    return NextResponse.json({ ok: false, error: "contentType_invalid" }, { status: 400 });
  }

  const preflightConfig: SeoPreflightConfig = {
    targetCount,
    market,
    locale,
    contentLanguage,
    contentType: ct as SeoPreflightContentType,
    site: typeof body.site === "string" ? body.site.trim() : undefined,
    draftMode: body.draftMode === true,
    maxEstimatedCost:
      body.maxEstimatedCost === undefined || body.maxEstimatedCost === null
        ? undefined
        : Number(body.maxEstimatedCost)
  };

  const runPreflight = body.runPreflight !== false;
  const runDraftGeneration = body.runDraftGeneration === true;

  try {
    const result = await runSeoAutomationPipeline({
      preflightConfig,
      runPreflight,
      runDraftGeneration
    });
    return NextResponse.json({ ok: result.ok, result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
