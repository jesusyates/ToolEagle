import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

export const dynamic = "force-dynamic";

const REPORT_PATH = path.join(process.cwd(), "data", "growth-report.json");

export async function GET() {
  try {
    if (!fs.existsSync(REPORT_PATH)) {
      return NextResponse.json({ topPages: [] });
    }
    const raw = fs.readFileSync(REPORT_PATH, "utf8");
    const data = JSON.parse(raw);
    return NextResponse.json({ topPages: data.topPages ?? [] });
  } catch {
    return NextResponse.json({ topPages: [] });
  }
}
