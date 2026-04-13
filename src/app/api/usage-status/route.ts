import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FREE_DAILY_LIMIT } from "@/lib/usage";
import { ANON_AI_COOKIE, parseAnonAiCookie } from "@/lib/anon-ai-cookie";
import { getSupporterLimitContext, getUserPlan } from "@/lib/api/generation-usage";
import { isAnonymousProEntitlement } from "@/lib/payment/anon-pro-entitlement";
import { readSupporterIdFromCookieStore } from "@/lib/supporter/supporter-id";
import { getCnCreditsBalance } from "@/lib/credits/credits-repository";

/**
 * Transitional Next route: cookie/anonymous usage + signed-in limits when the client has no Bearer for shared-core.
 * Primary Web read for signed-in flows: shared-core GET /v1/usage + /v1/quota (`fetchUsageStatusPayloadPrimary`).
 * Do not add new direct UI callers — extend shared-core mapping in `shared-core-usage-quota.ts` instead.
 *
 * V96: Read-only usage hint for upgrade triggers (no increment).
 * V100.1: limit reflects supporter daily bonus when applicable.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    const { effectiveFreeLimit } = await getSupporterLimitContext(request, user?.id ?? null);
    const sid = readSupporterIdFromCookieStore(request.cookies);
    const cnBal = await getCnCreditsBalance(user?.id ?? null, user ? null : sid);
    const creditExpireAt = cnBal?.expire_at ?? null;
    let creditDaysLeft: number | null = null;
    if (creditExpireAt) {
      creditDaysLeft = Math.max(0, Math.ceil((new Date(creditExpireAt).getTime() - Date.now()) / 86400000));
    }

    if (user) {
      const plan = await getUserPlan(user.id);
      if (cnBal && cnBal.remaining > 0 && (!creditExpireAt || new Date(creditExpireAt).getTime() > Date.now())) {
        return NextResponse.json({
          authenticated: true,
          plan: "pro",
          used: 0,
          limit: FREE_DAILY_LIMIT,
          remaining: cnBal.remaining,
          creditsRemaining: cnBal.remaining,
          creditsExpireAt: creditExpireAt,
          creditsDaysLeft: creditDaysLeft,
          billingModel: "credits"
        });
      }
      if (plan === "pro") {
        const today = new Date().toISOString().slice(0, 10);
        const { data: usage } = await supabase
          .from("usage_stats")
          .select("generations_count")
          .eq("user_id", user.id)
          .eq("date", today)
          .single();
        const used = usage?.generations_count ?? 0;
        return NextResponse.json({
          authenticated: true,
          plan: "pro",
          used,
          limit: effectiveFreeLimit,
          remaining: Math.max(0, effectiveFreeLimit - used),
          creditsRemaining: cnBal?.remaining ?? 0,
          creditsExpireAt: creditExpireAt,
          creditsDaysLeft: creditDaysLeft,
          billingModel: "legacy_pro"
        });
      }
      const today = new Date().toISOString().slice(0, 10);
      const { data: usage } = await supabase
        .from("usage_stats")
        .select("generations_count")
        .eq("user_id", user.id)
        .eq("date", today)
        .single();
      const used = usage?.generations_count ?? 0;
      return NextResponse.json({
        authenticated: true,
        plan: "free",
        used,
        limit: effectiveFreeLimit,
        remaining: Math.max(0, effectiveFreeLimit - used),
        creditsRemaining: cnBal?.remaining ?? 0,
        creditsExpireAt: creditExpireAt,
        creditsDaysLeft: creditDaysLeft,
        billingModel: "free"
      });
    }

    const anon = parseAnonAiCookie(request.cookies.get(ANON_AI_COOKIE)?.value);
    const anonPro = await isAnonymousProEntitlement(sid);
    if (cnBal && cnBal.remaining > 0 && (!creditExpireAt || new Date(creditExpireAt).getTime() > Date.now())) {
      return NextResponse.json({
        authenticated: false,
        plan: "pro",
        used: 0,
        limit: effectiveFreeLimit,
        remaining: cnBal.remaining,
        creditsRemaining: cnBal.remaining,
        creditsExpireAt: creditExpireAt,
        creditsDaysLeft: creditDaysLeft,
        billingModel: "credits"
      });
    }
    if (anonPro) {
      const used = anon;
      return NextResponse.json({
        authenticated: false,
        plan: "pro",
        used,
        limit: effectiveFreeLimit,
        remaining: Math.max(0, effectiveFreeLimit - used),
        creditsRemaining: cnBal?.remaining ?? 0,
        creditsExpireAt: creditExpireAt,
        creditsDaysLeft: creditDaysLeft,
        billingModel: "legacy_pro"
      });
    }
    return NextResponse.json({
      authenticated: false,
      plan: "free",
      used: anon,
      limit: effectiveFreeLimit,
      remaining: Math.max(0, effectiveFreeLimit - anon),
      creditsRemaining: cnBal?.remaining ?? 0,
      creditsExpireAt: creditExpireAt,
      creditsDaysLeft: creditDaysLeft,
      billingModel: "free"
    });
  } catch {
    return NextResponse.json(
      {
        authenticated: false,
        plan: "free",
        used: 0,
        limit: FREE_DAILY_LIMIT,
        remaining: FREE_DAILY_LIMIT
      },
      { status: 200 }
    );
  }
}
