/**
 * V101 — Market-separated checkout; unified Pro plan.
 */

export type PaymentMarket = "cn" | "global";

export type PaymentProviderId = "aggregator" | "lemon" | "stripe";

export type OrderPlan =
  | "donation"
  | "cn_trial"
  | "cn_standard"
  | "cn_advanced"
  | "cn_pro"
  | "global_starter"
  | "global_basic"
  | "global_standard"
  | "global_pro"
  | "legacy";

export type OrderKind = "credits" | "donation";

export type OrderStatus = "pending" | "paid" | "failed";
