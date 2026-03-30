import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/** V195 — append-only JSONL for TikTok chain completion analytics. */
export const runtime = "nodejs";

const LOG_PATH = path.join(process.cwd(), "generated", "tiktok-chain-events.jsonl");

const SESSION_START = "session_start";
const STEP = "step";

const STEP_EVENTS = new Set([
  "hook_generated",
  "caption_generated",
  "hashtag_generated",
  "title_generated",
  "copy_event",
  "upload_redirect"
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = typeof body?.type === "string" ? body.type : "";

    if (type === SESSION_START) {
      const chain_session_id = typeof body?.chain_session_id === "string" ? body.chain_session_id.trim() : "";
      const start_tool = typeof body?.start_tool === "string" ? body.start_tool.trim() : "";
      if (!chain_session_id || !start_tool) {
        return NextResponse.json({ ok: false, error: "chain_session_id and start_tool required" }, { status: 400 });
      }
      const line =
        JSON.stringify({
          ...body,
          type: SESSION_START,
          receivedAt: new Date().toISOString()
        }) + "\n";
      fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
      fs.appendFileSync(LOG_PATH, line, "utf8");
      return NextResponse.json({ ok: true });
    }

    if (type === STEP) {
      const chain_session_id = typeof body?.chain_session_id === "string" ? body.chain_session_id.trim() : "";
      const tool_slug = typeof body?.tool_slug === "string" ? body.tool_slug.trim() : "";
      const event = typeof body?.event === "string" ? body.event.trim() : "";
      if (!chain_session_id || !tool_slug || !STEP_EVENTS.has(event)) {
        return NextResponse.json({ ok: false, error: "invalid step payload" }, { status: 400 });
      }
      const line =
        JSON.stringify({
          ...body,
          type: STEP,
          receivedAt: new Date().toISOString()
        }) + "\n";
      fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
      fs.appendFileSync(LOG_PATH, line, "utf8");
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "invalid type" }, { status: 400 });
  } catch (e) {
    console.error("[v195 tiktok-chain]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
