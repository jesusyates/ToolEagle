import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { readSupporterIdFromCookieStore } from "@/lib/supporter/supporter-id";
import { listCreditUsageLogs } from "@/lib/credits/credits-repository";

/** GET — recent credit usage lines (auth or anonymous supporter cookie). */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const sid = readSupporterIdFromCookieStore(request.cookies);

  if (!user && !sid) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const limit = Math.min(100, Math.max(1, Number.parseInt(request.nextUrl.searchParams.get("limit") ?? "40", 10) || 40));
  const rows = await listCreditUsageLogs(user?.id ?? null, user ? null : sid, limit);
  return NextResponse.json({ logs: rows });
}
