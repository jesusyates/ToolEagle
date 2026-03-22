import type { PaymentMarket, PaymentProviderId } from "./types";

/**
 * Central routing: CN → aggregator (WeChat/Alipay via provider); global → Lemon/Stripe checkout link.
 * UI and APIs should call this instead of hardcoding provider choice.
 */
export function getPaymentProvider(market: PaymentMarket): PaymentProviderId {
  if (market === "cn") return "aggregator";
  return "lemon";
}

export function isAggregatorConfigured(): boolean {
  const base = (process.env.AGGREGATOR_BASE_URL || "").trim();
  const key = (process.env.AGGREGATOR_API_KEY || "").trim();
  return base.length > 0 && key.length > 0;
}
