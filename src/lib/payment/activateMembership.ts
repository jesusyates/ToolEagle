/**
 * V101 — Grant Pro after verified payment (auth profile + anonymous entitlement).
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { OrderRow } from "./orders-repository";
import { proSubscriptionDays } from "./config";
import { getCreditPack } from "@/lib/credits/credit-packs";
import { grantCreditsFromPaidOrder } from "@/lib/credits/credits-repository";

function admin() {
  return createAdminClient();
}

/**
 * Apply Pro extension from a paid order row. Idempotent-friendly: safe to call once per successful payment.
 */
export async function activateMembershipFromPaidOrder(order: OrderRow): Promise<{ ok: true } | { ok: false; error: string }> {
  const kind =
    order.order_type ??
    (order.plan === "donation" ? "donation" : order.plan.startsWith("credits_") ? "credits" : "pro");

  if (kind === "donation") {
    return { ok: true };
  }

  if (kind === "credits" || order.plan.startsWith("credits_")) {
    const pack = getCreditPack(order.plan);
    if (!pack) return { ok: false, error: "unknown_credit_pack" };
    return grantCreditsFromPaidOrder(order, { credits: pack.credits, durationDays: pack.days });
  }

  const days = proSubscriptionDays();
  const supabase = admin();
  const extendMs = days * 24 * 60 * 60 * 1000;

  try {
    if (order.user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan, plan_expire_at")
        .eq("id", order.user_id)
        .maybeSingle();

      const now = Date.now();
      const currentExp = profile?.plan_expire_at ? new Date(profile.plan_expire_at as string).getTime() : 0;
      const base = Math.max(now, Number.isFinite(currentExp) ? currentExp : 0);
      const newExp = new Date(base + extendMs).toISOString();

      const { data: existing } = await supabase.from("profiles").select("id").eq("id", order.user_id).maybeSingle();

      const patch = {
        plan: "pro" as const,
        plan_expire_at: newExp,
        updated_at: new Date().toISOString()
      };

      const { error } = existing
        ? await supabase.from("profiles").update(patch).eq("id", order.user_id)
        : await supabase.from("profiles").insert({ id: order.user_id, ...patch });

      if (error) {
        return { ok: false, error: error.message };
      }
      return { ok: true };
    }

    if (order.anonymous_user_id) {
      const { data: row } = await supabase
        .from("anonymous_pro_entitlements")
        .select("expires_at")
        .eq("anonymous_user_id", order.anonymous_user_id)
        .maybeSingle();

      const now = Date.now();
      const currentExp = row?.expires_at ? new Date(row.expires_at as string).getTime() : 0;
      const base = Math.max(now, Number.isFinite(currentExp) ? currentExp : 0);
      const newExp = new Date(base + extendMs).toISOString();

      const { error } = await supabase.from("anonymous_pro_entitlements").upsert(
        {
          anonymous_user_id: order.anonymous_user_id,
          expires_at: newExp,
          updated_at: new Date().toISOString(),
          last_order_id: order.id
        },
        { onConflict: "anonymous_user_id" }
      );

      if (error) {
        return { ok: false, error: error.message };
      }
      return { ok: true };
    }

    return { ok: false, error: "order_missing_identity" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "activate_failed" };
  }
}
