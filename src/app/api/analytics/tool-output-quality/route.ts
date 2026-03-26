import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/** V109 — append-only JSONL (Node / persistent disk). */
export const runtime = "nodejs";

const LOG_PATH = path.join(process.cwd(), "generated", "tool-output-actions.jsonl");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = typeof body?.type === "string" ? body.type : "";
    if (type !== "output_copy" && type !== "generation_complete") {
      return NextResponse.json({ ok: false, error: "invalid type" }, { status: 400 });
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
    console.error("[v109 tool-output-quality]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
