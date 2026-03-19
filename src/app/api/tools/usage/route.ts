import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event_type, tool_slug, tool_category, country } = body;

    if (!event_type || !tool_slug) {
      return NextResponse.json({ error: "Missing event_type or tool_slug" }, { status: 400 });
    }

    if (event_type !== "tool_generate" && event_type !== "tool_copy") {
      return NextResponse.json({ error: "Invalid event_type" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("tool_usage_events").insert({
      event_type,
      tool_slug: String(tool_slug).slice(0, 100),
      tool_category: tool_category ? String(tool_category).slice(0, 50) : null,
      country: country ? String(country).slice(0, 10) : null
    });

    if (error) {
      console.error("[tools/usage] Insert error:", error);
      return NextResponse.json({ error: "Failed to record" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[tools/usage] Error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
