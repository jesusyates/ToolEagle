/**
 * V92: Growth mission actions — log traffic + optional distribution_posts insert.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_PLATFORMS = ["reddit", "x", "quora"] as const;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const action = body?.action as string;
    const platform = body?.platform as string;
    const slug = body?.keyword ?? body?.slug;

    if (action === "log_start" || action === "click_boost") {
      try {
        await supabase.from("traffic_events").insert({
          user_id: user.id,
          source: action === "click_boost" ? "growth_mission_boost" : "growth_mission",
          page: typeof slug === "string" ? slug : "dashboard",
          meta: { platform: platform ?? null, action }
        });
      } catch {
        /* traffic_events table optional until migration */
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "complete_post") {
      if (!platform || !VALID_PLATFORMS.includes(platform as (typeof VALID_PLATFORMS)[number])) {
        return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
      }
      if (!slug || typeof slug !== "string") {
        return NextResponse.json({ error: "Missing keyword/slug" }, { status: 400 });
      }

      const { error } = await supabase.from("distribution_posts").insert({
        user_id: user.id,
        platform,
        keyword: slug.slice(0, 200)
      });
      if (error) {
        console.error("[growth-mission/execute] distribution_posts", error);
        return NextResponse.json({ error: "Failed to record post" }, { status: 500 });
      }

      try {
        await supabase.from("traffic_events").insert({
          user_id: user.id,
          source: "growth_mission_complete",
          page: slug,
          meta: { platform }
        });
      } catch {
        /* optional */
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error("[growth-mission/execute]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
