/**
 * V101 — Server-side amounts for CN Pro (aggregator). Display uses public mirror.
 */

import type { OrderPlan } from "./types";
import { getCreditPack } from "@/lib/credits/credit-packs";
import { getCreditPackage } from "@/lib/billing/package-config";

export function getCnProMonthlyCny(): number {
  /** V104.2 — default ¥29 tier as dominant CN Pro anchor (override via env in production). */
  const raw = process.env.CN_PRO_MONTHLY_CNY ?? process.env.NEXT_PUBLIC_CN_PRO_MONTHLY_CNY ?? "29";
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n) || n <= 0 || n > 1e6) return 69;
  return Math.round(n * 100) / 100;
}

export function amountForPlan(plan: OrderPlan, market: "cn" | "global"): { amount: number; currency: "CNY" | "USD" } {
  if (plan === "donation") {
    return { amount: 0, currency: market === "cn" ? "CNY" : "USD" };
  }
  const sharedPack = getCreditPackage(market, plan);
  if (sharedPack) {
    return { amount: sharedPack.amount, currency: sharedPack.currency };
  }
  const pack = getCreditPack(plan);
  if (pack) return { amount: pack.cny, currency: "CNY" };
  return market === "cn"
    ? { amount: getCnProMonthlyCny(), currency: "CNY" }
    : { amount: 12, currency: "USD" };
}

export function proSubscriptionDays(): number {
  const d = Number.parseInt(process.env.PRO_SUBSCRIPTION_DAYS ?? "30", 10);
  if (!Number.isFinite(d) || d < 1 || d > 366) return 30;
  return d;
}
