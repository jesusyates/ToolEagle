import { NextRequest, NextResponse } from "next/server";
import { processDueScheduledSeoPublishes } from "@/lib/seo/scheduled-publish";
import { createAdminClient } from "@/lib/supabase/admin";

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const isCron =
    authHeader === `Bearer ${CRON_SECRET}` ||
    request.headers.get("x-vercel-cron") === "true";

  if (!isCron && !process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (CRON_SECRET && !isCron) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    let maxPerRun = 3;
    try {
      const body = (await request.json()) as { maxPerRun?: unknown } | null;
      const n = Number(body?.maxPerRun);
      if (Number.isFinite(n)) maxPerRun = n;
    } catch {
      /* optional body */
    }
    const db = createAdminClient();
    const out = await processDueScheduledSeoPublishes(db, { maxPerRun });
    return NextResponse.json({ ok: true, ...out });
  } catch (e) {
    console.error("[cron/seo-scheduled-publish]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}

export const maxDuration = 120;
