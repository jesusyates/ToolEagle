import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type ContentItemInsertPayload = {
  content_id: string;
  user_id?: string | null;
  anonymous_id: string;
  tool_type: "hook" | "caption" | "hashtag" | "title";
  platform: "tiktok";
  input_text: string;
  generated_output: unknown;
  chain_session_id?: string | null;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<ContentItemInsertPayload>;

    const content_id = typeof body?.content_id === "string" ? body.content_id.trim() : "";
    const anonymous_id = typeof body?.anonymous_id === "string" ? body.anonymous_id.trim() : "";
    const tool_type = body?.tool_type;
    const platform = body?.platform;
    const input_text = typeof body?.input_text === "string" ? body.input_text : "";
    const generated_output = body?.generated_output;
    const chain_session_id =
      typeof body?.chain_session_id === "string" ? body.chain_session_id : body?.chain_session_id ?? null;

    if (
      !content_id ||
      !anonymous_id ||
      !input_text ||
      (tool_type !== "hook" && tool_type !== "caption" && tool_type !== "hashtag" && tool_type !== "title") ||
      platform !== "tiktok" ||
      generated_output === undefined
    ) {
      return NextResponse.json({ ok: false, error: "invalid payload" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { error } = await supabase.from("content_items").insert({
      id: content_id,
      user_id: body.user_id ?? null,
      anonymous_id,
      tool_type,
      platform,
      input_text: input_text.slice(0, 20000),
      generated_output,
      chain_session_id: chain_session_id ?? null
    });

    if (error) {
      // If tables/policies are not deployed yet, do not break user UX.
      if (
        error.code === "42P01" ||
        String(error.message || "").toLowerCase().includes("relation") ||
        String(error.message || "").toLowerCase().includes("does not exist")
      ) {
        return NextResponse.json({ ok: true, skipped: true, reason: "missing relation" });
      }
      console.error("[v196 content-items] insert failed", error);
      return NextResponse.json({ ok: false, error: "insert failed" }, { status: 200 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[v196 content-items] fatal", e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

