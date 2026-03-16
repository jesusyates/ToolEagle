import { NextRequest, NextResponse } from "next/server";
import { runContentFactory } from "@/lib/content-factory";

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const isCron =
    authHeader === `Bearer ${CRON_SECRET}` ||
    request.headers.get("x-vercel-cron") === "true";

  if (!isCron && !process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (CRON_SECRET && !isCron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let config: { captions?: number; hooks?: number; ideas?: number; prompts?: number } | undefined;
    try {
      const body = await request.json();
      config = body?.config;
    } catch {
      config = undefined;
    }

    const result = await runContentFactory(config);

    return NextResponse.json({
      ok: true,
      ...result,
      total: result.captions + result.hooks + result.ideas + result.prompts,
      errors: result.errors.slice(0, 10)
    });
  } catch (e) {
    console.error("[api/generate-content] API Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Content generation failed" },
      { status: 500 }
    );
  }
}

export const maxDuration = 300;
