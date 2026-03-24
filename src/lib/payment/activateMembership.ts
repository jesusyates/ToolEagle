/**
 * V101 — Grant Pro after verified payment (auth profile + anonymous entitlement).
 */

import type { OrderRow } from "./orders-repository";
import { grantCreditsFromPaidOrder } from "@/lib/credits/credits-repository";
import { getCreditPackage } from "@/lib/billing/package-config";

/**
 * Apply Pro extension from a paid order row. Idempotent-friendly: safe to call once per successful payment.
 */
export async function activateMembershipFromPaidOrder(order: OrderRow): Promise<{ ok: true } | { ok: false; error: string }> {
  const kind = order.order_type ?? (order.plan === "donation" ? "donation" : "credits");

  if (kind === "donation") {
    return { ok: true };
  }

  const packageId = order.package_id || order.plan;
  const market = order.market === "cn" ? "cn" : "global";
  const pack = getCreditPackage(market, packageId);
  if (!pack) return { ok: false, error: "unknown_credit_pack" };
  return grantCreditsFromPaidOrder(order, { credits: pack.credits_total, durationDays: pack.validity_days });
}
