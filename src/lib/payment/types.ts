/**
 * V101 — Market-separated checkout; unified Pro plan.
 */

export type PaymentMarket = "cn" | "global";

export type PaymentProviderId = "aggregator" | "lemon" | "stripe";

export type OrderPlan =
  | "pro_monthly"
  | "donation"
  | "credits_starter"
  | "credits_standard"
  | "credits_advanced"
  | "credits_pro";

/** V101.1 — order row kind · V107 credits pack */
export type OrderKind = "pro" | "donation" | "credits";

export type OrderStatus = "pending" | "paid" | "failed";
