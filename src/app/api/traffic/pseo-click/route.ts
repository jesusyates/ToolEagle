/**
 * V93.1: Log pseo → money-page clicks for attribution (traffic_events + normalized columns).
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body.targetPage !== "string") {
      return NextResponse.json({ error: "targetPage required" }, { status: 400 });
    }

    const targetPage = String(body.targetPage).slice(0, 2048);
    const sourcePage = typeof body.sourcePage === "string" ? body.sourcePage.slice(0, 2048) : "";
    const locale = body.locale === "zh" ? "zh" : "en";
    const tool = typeof body.tool === "string" ? body.tool.slice(0, 200) : null;
    const variant = typeof body.variant === "string" ? body.variant.slice(0, 64) : "unknown";

    const admin = createAdminClient();
    const insert: Record<string, unknown> = {
      source: "pseo",
      page: targetPage,
      source_page: sourcePage || null,
      target_page: targetPage,
      locale,
      meta: { tool, variant, source: "pseo" }
    };

    const { error } = await admin.from("traffic_events").insert(insert);
    if (error) {
      const legacyInsert = {
        source: "pseo",
        page: targetPage,
        meta: { tool, variant, source: "pseo", source_page: sourcePage, target_page: targetPage, locale }
      };
      const { error: e2 } = await admin.from("traffic_events").insert(legacyInsert);
      if (e2) {
        console.error("[pseo-click]", e2);
        return NextResponse.json({ ok: false }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[pseo-click]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
