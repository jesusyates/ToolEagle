/**
 * V92: Record traffic_events (homepage / tool / content / external).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SOURCES = ["homepage", "tool", "content", "external", "growth_mission", "injection"] as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const source = body?.source as string;
    const page = body?.page as string;
    const meta = typeof body?.meta === "object" && body.meta ? body.meta : {};

    if (!source || !SOURCES.includes(source as (typeof SOURCES)[number])) {
      return NextResponse.json({ error: "Invalid source" }, { status: 400 });
    }
    if (!page || typeof page !== "string") {
      return NextResponse.json({ error: "Invalid page" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("traffic_events").insert({
      user_id: user?.id ?? null,
      source,
      page: page.slice(0, 500),
      meta
    });

    if (error) {
      if (error.message?.includes("relation") || error.code === "42P01") {
        return NextResponse.json({ ok: true, skipped: true });
      }
      console.error("[analytics/traffic-event]", error);
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[analytics/traffic-event]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
