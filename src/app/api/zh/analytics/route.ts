import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_EVENTS = ["tool_click", "email_submit", "page_view"] as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const eventType = body?.event_type;
    const eventData = body?.event_data ?? {};

    if (!eventType || !ALLOWED_EVENTS.includes(eventType)) {
      return NextResponse.json({ error: "Invalid event_type" }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.from("zh_analytics").insert({
      event_type: eventType,
      event_data: typeof eventData === "object" ? eventData : {}
    });

    if (error) {
      console.error("[zh/analytics] Insert error:", error);
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[zh/analytics] Error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
