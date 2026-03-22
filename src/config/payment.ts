/**
 * V94: Lemon Squeezy / checkout — public env only (safe for client bundles).
 * V101: CN market → /zh/pricing in-app aggregator flow (not personal QR / not Lemon).
 */

export type UpgradeMarket = "cn" | "global";

/** ToolEagle Pro checkout URL (e.g. Lemon Squeezy product link). */
export function getPaymentLink(): string {
  return (process.env.NEXT_PUBLIC_PAYMENT_LINK || "").trim();
}

export function hasPaymentLink(): boolean {
  return getPaymentLink().length > 0;
}

/**
 * Primary upgrade destination by market (from `getPaymentProvider` / cookies).
 * - `cn` → Chinese pricing anchor (WeChat/Alipay via aggregator API).
 * - `global` → external checkout when configured, else /pricing.
 */
export function getUpgradeHref(market: UpgradeMarket = "global"): string {
  if (market === "cn") {
    return "/zh/pricing#cn-pro-checkout";
  }
  return hasPaymentLink() ? getPaymentLink() : "/pricing";
}
