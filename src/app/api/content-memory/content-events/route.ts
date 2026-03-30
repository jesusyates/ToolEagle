import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type ContentEventInsertPayload = {
  content_id: string;
  event_type: "generate" | "copy" | "upload_redirect";
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<ContentEventInsertPayload>;
    const content_id = typeof body?.content_id === "string" ? body.content_id.trim() : "";
    const event_type = body?.event_type;

    if (!content_id || !event_type || !["generate", "copy", "upload_redirect"].includes(event_type)) {
      return NextResponse.json({ ok: false, error: "invalid payload" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("content_events").insert({
      content_id,
      event_type
    });

    if (error) {
      if (
        error.code === "42P01" ||
        String(error.message || "").toLowerCase().includes("relation") ||
        String(error.message || "").toLowerCase().includes("does not exist")
      ) {
        return NextResponse.json({ ok: true, skipped: true, reason: "missing relation" });
      }
      console.error("[v196 content-events] insert failed", error);
      return NextResponse.json({ ok: false, error: "insert failed" }, { status: 200 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[v196 content-events] fatal", e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

