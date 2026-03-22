/**
 * CN prepaid credits (user_credits + credit_usage_logs). Server-side admin only.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { OrderRow } from "@/lib/payment/orders-repository";

export type CnCreditsBalance = {
  remaining: number;
  expire_at: string | null;
  total_credits: number;
};

function admin() {
  return createAdminClient();
}

export async function getCnCreditsBalance(
  userId: string | null,
  anonymousUserId: string | null
): Promise<CnCreditsBalance | null> {
  if (!userId && !anonymousUserId) return null;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) return null;
  try {
    const supabase = admin();
    const q = supabase.from("user_credits").select("remaining_credits, expire_at, total_credits");
    const { data, error } = userId
      ? await q.eq("user_id", userId).maybeSingle()
      : await q.eq("anonymous_user_id", anonymousUserId as string).maybeSingle();
    if (error || !data) return null;
    const rem = Number(data.remaining_credits ?? 0);
    const exp = data.expire_at as string | null;
    if (exp && new Date(exp).getTime() <= Date.now()) {
      return { remaining: 0, expire_at: exp, total_credits: Number(data.total_credits ?? 0) };
    }
    return {
      remaining: rem,
      expire_at: exp,
      total_credits: Number(data.total_credits ?? 0)
    };
  } catch {
    return null;
  }
}

function daysFromMs(base: number, durationDays: number): string {
  return new Date(base + durationDays * 86400000).toISOString();
}

async function upsertUserCreditsRow(params: {
  userId: string | null;
  anonymousUserId: string | null;
  credits: number;
  durationDays: number;
}): Promise<{ ok: true; newExpire: string } | { ok: false; error: string }> {
  const { userId, anonymousUserId, credits, durationDays } = params;
  const supabase = admin();
  const now = Date.now();

  const q = supabase.from("user_credits").select("id, remaining_credits, expire_at, total_credits");
  const { data: row } = userId
    ? await q.eq("user_id", userId).maybeSingle()
    : await q.eq("anonymous_user_id", anonymousUserId as string).maybeSingle();

  const currentExp = row?.expire_at ? new Date(row.expire_at as string).getTime() : 0;
  const expired = !row?.expire_at || currentExp <= now;
  const base = expired ? now : Math.max(now, currentExp);
  const newExpire = daysFromMs(base, durationDays);
  const nextRem = (expired ? 0 : Number(row?.remaining_credits ?? 0)) + credits;
  const nextTotal = (expired ? 0 : Number(row?.total_credits ?? 0)) + credits;

  const patch = {
    remaining_credits: nextRem,
    total_credits: nextTotal,
    expire_at: newExpire,
    updated_at: new Date().toISOString()
  };

  if (row?.id) {
    const { error } = await supabase.from("user_credits").update(patch).eq("id", row.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("user_credits").insert({
      user_id: userId,
      anonymous_user_id: anonymousUserId,
      ...patch
    });
    if (error) return { ok: false, error: error.message };
  }
  return { ok: true, newExpire };
}

/**
 * Stack credits + extend expiry from max(now, current_expire) + duration.
 */
export async function grantCreditsFromPaidOrder(
  order: OrderRow,
  opts: { credits: number; durationDays: number }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { credits, durationDays } = opts;
  if (credits <= 0 || durationDays <= 0) return { ok: false, error: "invalid_pack" };

  try {
    if (!order.user_id && !order.anonymous_user_id) {
      return { ok: false, error: "order_missing_identity" };
    }

    const up = await upsertUserCreditsRow({
      userId: order.user_id,
      anonymousUserId: order.anonymous_user_id,
      credits,
      durationDays
    });
    if (!up.ok) return up;

    const supabase = admin();
    await supabase
      .from("orders")
      .update({
        credits_total: credits,
        credits_remaining: credits,
        credits_expire_at: up.newExpire
      })
      .eq("id", order.id);

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "grant_failed" };
  }
}

export async function deductCnCredits(params: {
  userId: string | null;
  anonymousUserId: string | null;
  cost: number;
  toolSlug: string;
  meta?: Record<string, unknown>;
}): Promise<{ ok: true; remaining: number } | { ok: false; error: string; remaining?: number }> {
  const { userId, anonymousUserId, cost, toolSlug, meta } = params;
  if (cost <= 0) return { ok: true, remaining: 0 };
  if (!userId && !anonymousUserId) return { ok: false, error: "no_identity" };

  const supabase = admin();

  const { data: row } = userId
    ? await supabase.from("user_credits").select("*").eq("user_id", userId).maybeSingle()
    : await supabase.from("user_credits").select("*").eq("anonymous_user_id", anonymousUserId as string).maybeSingle();

  if (!row) return { ok: false, error: "no_credits_row", remaining: 0 };

  const exp = row.expire_at as string | null;
  if (exp && new Date(exp).getTime() <= Date.now()) {
    return { ok: false, error: "credits_expired", remaining: 0 };
  }

  const rem = Number(row.remaining_credits ?? 0);
  if (rem < cost) return { ok: false, error: "insufficient_credits", remaining: rem };

  const next = rem - cost;
  const { error: upErr } = await supabase
    .from("user_credits")
    .update({
      remaining_credits: next,
      updated_at: new Date().toISOString()
    })
    .eq("id", row.id)
    .gte("remaining_credits", cost);

  if (upErr) return { ok: false, error: upErr.message, remaining: rem };

  await supabase.from("credit_usage_logs").insert({
    user_id: userId,
    anonymous_user_id: anonymousUserId,
    tool_slug: toolSlug,
    credits_used: cost,
    remaining_after: next,
    meta: meta ?? {}
  });

  return { ok: true, remaining: next };
}

export async function listCreditUsageLogs(
  userId: string | null,
  anonymousUserId: string | null,
  limit = 50
): Promise<
  Array<{
    id: string;
    tool_slug: string;
    credits_used: number;
    remaining_after: number;
    created_at: string;
    meta: Record<string, unknown>;
  }>
> {
  if (!userId && !anonymousUserId) return [];
  const supabase = admin();
  const q = supabase
    .from("credit_usage_logs")
    .select("id, tool_slug, credits_used, remaining_after, created_at, meta")
    .order("created_at", { ascending: false })
    .limit(limit);
  const { data, error } = userId
    ? await q.eq("user_id", userId)
    : await q.eq("anonymous_user_id", anonymousUserId as string);
  if (error || !data) return [];
  return data as Array<{
    id: string;
    tool_slug: string;
    credits_used: number;
    remaining_after: number;
    created_at: string;
    meta: Record<string, unknown>;
  }>;
}
