/**
 * Shared usage / limit checks for /api/generate and /api/generate-package (V95).
 * V100.1: supporter perks extend free daily limit for ledger-linked users.
 */

import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FREE_DAILY_LIMIT } from "@/lib/usage";
import { ANON_AI_COOKIE, applyAnonAiCookie, parseAnonAiCookie } from "@/lib/anon-ai-cookie";
import type { NextResponse } from "next/server";
import { readSupporterIdFromCookieStore } from "@/lib/supporter/supporter-id";
import {
  effectiveFreeDailyLimit,
  getSupporterPerksForUserKey,
  type SupporterPerks
} from "@/lib/supporter/supporter-perks";
import { isAnonymousProEntitlement } from "@/lib/payment/anon-pro-entitlement";
import { getCnCreditsBalance, deductCnCredits } from "@/lib/credits/credits-repository";
import type { RoutedMarket } from "@/lib/ai/router";

export const LIMIT_MESSAGE =
  "You've reached today's free limit. Upgrade with credits to continue generating full post packages.";

function isProfilePro(
  plan: string | undefined,
  planExpireAt: string | null | undefined
): boolean {
  if (plan !== "pro") return false;
  if (planExpireAt == null || planExpireAt === "") return true;
  return new Date(planExpireAt).getTime() > Date.now();
}

export async function getUserPlan(userId: string): Promise<"free" | "pro"> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, plan_expire_at")
    .eq("id", userId)
    .single();
  if (!profile) {
    await supabase.from("profiles").insert({ id: userId, plan: "free" });
    return "free";
  }
  return isProfilePro(profile.plan, profile.plan_expire_at as string | null | undefined) ? "pro" : "free";
}

/** Ledger key: logged-in user id, else anonymous supporter cookie (if any). */
export function resolveSupporterLedgerKey(
  request: NextRequest,
  loggedInUserId: string | null
): string | null {
  if (loggedInUserId) return loggedInUserId;
  return readSupporterIdFromCookieStore(request.cookies);
}

export async function getSupporterLimitContext(
  request: NextRequest,
  loggedInUserId: string | null
): Promise<{ ledgerKey: string | null; perks: SupporterPerks; effectiveFreeLimit: number }> {
  const ledgerKey = resolveSupporterLedgerKey(request, loggedInUserId);
  const perks = await getSupporterPerksForUserKey(ledgerKey);
  return {
    ledgerKey,
    perks,
    effectiveFreeLimit: effectiveFreeDailyLimit(perks)
  };
}

async function checkAndRecordUsage(
  userId: string,
  dailyLimit: number
): Promise<{ allowed: boolean; used: number }> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, plan_expire_at")
    .eq("id", userId)
    .single();

  if (!profile) {
    await supabase.from("profiles").insert({ id: userId, plan: "free" });
  }

  const { data: usage } = await supabase
    .from("usage_stats")
    .select("generations_count")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  const used = usage?.generations_count ?? 0;
  if (used >= dailyLimit) {
    return { allowed: false, used };
  }

  return { allowed: true, used };
}

async function incrementUsage(userId: string): Promise<void> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from("usage_stats")
    .select("id, generations_count")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  if (existing) {
    await supabase
      .from("usage_stats")
      .update({ generations_count: existing.generations_count + 1 })
      .eq("id", existing.id);
  } else {
    await supabase.from("usage_stats").insert({
      user_id: userId,
      date: today,
      generations_count: 1
    });
  }
}

export type UsageGateResult =
  | {
      ok: true;
      userId: string | null;
      plan: "free" | "pro";
      anonCount: number;
      supporterPerks: SupporterPerks;
      effectiveFreeLimit: number;
      /** V107 — CN credits (deduct per generate-package) */
      creditsMode?: boolean;
      creditBalance?: number;
      creditExpireAt?: string | null;
      /** For finalize when userId is null */
      anonymousSupporterId?: string | null;
    }
  | { ok: false; status: 429; used: number; limit: number };

export async function gateGenerationUsage(
  request: NextRequest,
  opts?: { market?: RoutedMarket }
): Promise<UsageGateResult> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const anonCount = parseAnonAiCookie(request.cookies.get(ANON_AI_COOKIE)?.value);
  const { perks, effectiveFreeLimit } = await getSupporterLimitContext(request, user?.id ?? null);
  const sid = readSupporterIdFromCookieStore(request.cookies);
  const market = opts?.market ?? "global";

  /** Shared prepaid credits take precedence over daily free limit */
  const bal = await getCnCreditsBalance(user?.id ?? null, user ? null : sid);
  if (bal && bal.remaining > 0 && (!bal.expire_at || new Date(bal.expire_at).getTime() > Date.now())) {
    return {
      ok: true,
      userId: user?.id ?? null,
      plan: "pro",
      anonCount,
      supporterPerks: perks,
      effectiveFreeLimit,
      creditsMode: true,
      creditBalance: bal.remaining,
      creditExpireAt: bal.expire_at,
      anonymousSupporterId: user ? null : sid
    };
  }

  if (user) {
    const { allowed, used } = await checkAndRecordUsage(user.id, effectiveFreeLimit);
    if (!allowed) {
      return { ok: false, status: 429, used, limit: effectiveFreeLimit };
    }
    const plan = await getUserPlan(user.id);
    return {
      ok: true,
      userId: user.id,
      plan,
      anonCount,
      supporterPerks: perks,
      effectiveFreeLimit,
      anonymousSupporterId: null
    };
  }

  const anonSupporterId = sid;
  const anonPro = await isAnonymousProEntitlement(anonSupporterId);
  if (anonPro) {
    return {
      ok: true,
      userId: null,
      plan: "pro",
      anonCount,
      supporterPerks: perks,
      effectiveFreeLimit,
      anonymousSupporterId: anonSupporterId ?? null
    };
  }

  if (anonCount >= effectiveFreeLimit) {
    return { ok: false, status: 429, used: anonCount, limit: effectiveFreeLimit };
  }

  return {
    ok: true,
    userId: null,
    plan: "free",
    anonCount,
    supporterPerks: perks,
    effectiveFreeLimit,
    anonymousSupporterId: anonSupporterId ?? null
  };
}

export async function finalizeGenerationUsage(
  gate: Extract<UsageGateResult, { ok: true }>,
  response: NextResponse,
  opts?: {
    creditsCost?: number;
    toolSlug?: string;
    market?: "cn" | "global";
    requestType?: string;
    meta?: Record<string, unknown>;
  }
): Promise<{ creditsRemaining?: number; creditsUsed?: number } | void> {
  const cost = opts?.creditsCost ?? 0;
  if (gate.creditsMode && cost > 0) {
    const d = await deductCnCredits({
      userId: gate.userId,
      anonymousUserId: gate.anonymousSupporterId ?? null,
      cost,
      toolSlug: opts?.toolSlug ?? "post_package",
      market: opts?.market ?? "global",
      requestType: opts?.requestType ?? "generate_package",
      meta: opts?.meta
    });
    if (!d.ok) {
      console.error("[finalizeGenerationUsage] credits deduct failed", d);
      return;
    }
    return { creditsRemaining: d.remaining, creditsUsed: cost };
  }

  if (gate.userId) {
    await incrementUsage(gate.userId);
  } else if (gate.plan !== "pro") {
    applyAnonAiCookie(response, gate.anonCount + 1);
  }
}

/**
 * For /api/generate (legacy route) — same limit rules as package gate.
 */
export async function checkSignedInFreeUsageWithSupporterBonus(
  userId: string,
  dailyLimit: number
): Promise<{ allowed: boolean; used: number }> {
  return checkAndRecordUsage(userId, dailyLimit);
}
