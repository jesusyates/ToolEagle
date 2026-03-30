import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/** Node runtime: append-only JSONL for V108 conversion funnel (local / persistent disk). */
export const runtime = "nodejs";

const LOG_PATH = path.join(process.cwd(), "generated", "tool-click-events.jsonl");

const ALLOWED = new Set([
  "tool_click",
  "tool_entry",
  "tool_copy",
  "publish_redirect_click",
  "generation_complete"
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = typeof body?.type === "string" ? body.type : "";
    if (!ALLOWED.has(type)) {
      return NextResponse.json({ ok: false, error: "invalid type" }, { status: 400 });
    }

    if (
      (type === "tool_copy" || type === "publish_redirect_click" || type === "generation_complete") &&
      (typeof body?.toolSlug !== "string" || !String(body.toolSlug).trim())
    ) {
      return NextResponse.json({ ok: false, error: "toolSlug required" }, { status: 400 });
    }

    const line =
      JSON.stringify({
        ...body,
        receivedAt: new Date().toISOString()
      }) + "\n";

    fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
    fs.appendFileSync(LOG_PATH, line, "utf8");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[v108 tool-funnel]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
