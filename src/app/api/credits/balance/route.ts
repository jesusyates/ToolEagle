import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { readSupporterIdFromCookieStore } from "@/lib/supporter/supporter-id";
import { getCnCreditsBalance } from "@/lib/credits/credits-repository";
import { COOKIE_PREFERRED_MARKET } from "@/config/market";

/** GET — shared credits balance (user or anonymous wallet). */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    const sid = readSupporterIdFromCookieStore(request.cookies);
    const bal = await getCnCreditsBalance(user?.id ?? null, user ? null : sid);

    const expireAt = bal?.expire_at ?? null;
    let daysLeft: number | null = null;
    if (expireAt) {
      const ms = new Date(expireAt).getTime() - Date.now();
      daysLeft = Math.max(0, Math.ceil(ms / 86400000));
    }

    const marketView = (request.nextUrl.searchParams.get("market") ||
      request.cookies.get(COOKIE_PREFERRED_MARKET)?.value ||
      "global") as "cn" | "global";
    return NextResponse.json({
      remaining_credits: bal?.remaining ?? 0,
      total_credits: bal?.total_credits ?? 0,
      expire_at: expireAt,
      days_left: daysLeft,
      current_market_view: marketView,
      wallet_type: user ? "user" : "anonymous",
      remaining: bal?.remaining ?? 0,
      totalCredits: bal?.total_credits ?? 0,
      expireAt
    });
  } catch {
    return NextResponse.json(
      {
        remaining_credits: 0,
        total_credits: 0,
        expire_at: null,
        days_left: null,
        current_market_view: "global",
        wallet_type: "anonymous"
      },
      { status: 200 }
    );
  }
}
