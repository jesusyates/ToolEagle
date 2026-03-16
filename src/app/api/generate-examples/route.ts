import { NextRequest, NextResponse } from "next/server";
import { generateExamples } from "@/lib/auto-content-generator";

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
    const { generated, errors } = await generateExamples(50);
    return NextResponse.json({
      ok: true,
      generated,
      errors: errors.slice(0, 5)
    });
  } catch (e) {
    console.error("generate-examples error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Generation failed" },
      { status: 500 }
    );
  }
}

export const maxDuration = 300;
