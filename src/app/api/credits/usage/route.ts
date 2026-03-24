import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { readSupporterIdFromCookieStore } from "@/lib/supporter/supporter-id";
import { listCreditUsageLogs } from "@/lib/credits/credits-repository";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCnCreditsBalance } from "@/lib/credits/credits-repository";

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
  const admin = createAdminClient();
  const q = admin
    .from("orders")
    .select("order_id, package_id, amount, currency, status, paid_at, created_at, order_type")
    .eq("status", "paid")
    .in("order_type", ["credits", "donation"])
    .order("paid_at", { ascending: false })
    .limit(20);
  const { data: purchases } = user
    ? await q.eq("user_id", user.id)
    : await q.eq("anonymous_user_id", sid as string);
  const balance = await getCnCreditsBalance(user?.id ?? null, user ? null : sid);
  return NextResponse.json({
    logs: rows,
    recent_purchases: purchases ?? [],
    balance_summary: {
      remaining_credits: balance?.remaining ?? 0,
      total_credits: balance?.total_credits ?? 0,
      expire_at: balance?.expire_at ?? null
    }
  });
}
