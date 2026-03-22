import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { readSupporterIdFromCookieStore } from "@/lib/supporter/supporter-id";
import { getCnCreditsBalance } from "@/lib/credits/credits-repository";

/** GET — current CN credits balance + expiry (auth or te_supporter_id). */
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

    return NextResponse.json({
      remaining: bal?.remaining ?? 0,
      expireAt,
      daysLeft,
      totalCredits: bal?.total_credits ?? 0
    });
  } catch {
    return NextResponse.json(
      { remaining: 0, expireAt: null, daysLeft: null, totalCredits: 0 },
      { status: 200 }
    );
  }
}
