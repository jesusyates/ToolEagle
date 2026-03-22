/**
 * V79: AI ping endpoint - placeholder for future use.
 * Future: notify indexing systems, trigger crawl refresh.
 * No real integration yet.
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "AI ping endpoint. Future: indexing notification.",
    timestamp: new Date().toISOString()
  });
}

export async function POST() {
  return NextResponse.json({
    ok: true,
    message: "AI ping received. Future: trigger crawl refresh.",
    timestamp: new Date().toISOString()
  });
}
