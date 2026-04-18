import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import fs from "node:fs/promises";
import path from "node:path";
import { isAdmin } from "@/lib/auth/isAdmin";
import { SEO_PREFLIGHT_CONTENT_TYPES, type SeoPreflightContentType } from "@/lib/seo-preflight";
import { runSeoAutoPipeline, seoAutoRunLogRelativePath } from "@/lib/seo-job-runner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const p = path.join(process.cwd(), seoAutoRunLogRelativePath());
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

  const wanted = Number(body.wanted);
  if (!Number.isFinite(wanted) || wanted < 1 || wanted > 500) {
    return NextResponse.json({ ok: false, error: "wanted_invalid" }, { status: 400 });
  }

  const market = typeof body.market === "string" && body.market.trim() ? body.market.trim() : "global";
  const locale = typeof body.locale === "string" && body.locale.trim() ? body.locale.trim() : "en-US";
  const contentLanguage =
    typeof body.contentLanguage === "string" && body.contentLanguage.trim() ? body.contentLanguage.trim() : "en";
  const ct = typeof body.contentType === "string" ? body.contentType.trim() : "guide";
  if (!SEO_PREFLIGHT_CONTENT_TYPES.includes(ct as SeoPreflightContentType)) {
    return NextResponse.json({ ok: false, error: "contentType_invalid" }, { status: 400 });
  }

  const jaccardThreshold =
    body.jaccardThreshold === undefined || body.jaccardThreshold === null
      ? undefined
      : Number(body.jaccardThreshold);

  const schedulePublish = body.schedulePublish !== false;
  const publishDailyMaxRaw = Number(body.publishDailyMax);
  const publishDailyMax =
    body.publishDailyMax === undefined || body.publishDailyMax === null
      ? undefined
      : Number.isFinite(publishDailyMaxRaw)
        ? publishDailyMaxRaw
        : undefined;

  try {
    const result = await runSeoAutoPipeline({
      wanted,
      market,
      locale,
      contentLanguage,
      contentType: ct as SeoPreflightContentType,
      site: typeof body.site === "string" ? body.site.trim() : undefined,
      draftMode: body.draftMode === true,
      maxEstimatedCost:
        body.maxEstimatedCost === undefined || body.maxEstimatedCost === null
          ? undefined
          : Number(body.maxEstimatedCost),
      jaccardThreshold:
        Number.isFinite(jaccardThreshold) && jaccardThreshold != null
          ? Math.max(0.8, Math.min(0.99, jaccardThreshold))
          : undefined,
      schedulePublish,
      publishDailyMax
    });

    revalidatePath("/admin/seo");

    return NextResponse.json({
      ok: result.ok,
      summary: {
        wanted: result.wanted,
        planned: result.planned,
        approved: result.approved,
        generated: result.generated,
        queued: result.queued,
        scheduledForPublish: result.scheduledForPublish,
        publishSchedule: result.publishSchedule,
        stopReason: result.stopReason,
        error: result.error
      },
      steps: result.steps,
      result
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
