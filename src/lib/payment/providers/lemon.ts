import crypto from "node:crypto";

/**
 * Lemon Squeezy webhook signing (see https://docs.lemonsqueezy.com/help/webhooks/signing-requests).
 */
export function verifyLemonSqueezyWebhookSignature(rawBody: string, xSignature: string | null, signingSecret: string): boolean {
  if (!signingSecret || !xSignature) return false;
  const hmac = crypto.createHmac("sha256", signingSecret);
  const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
  const sig = Buffer.from(xSignature, "utf8");
  if (digest.length !== sig.length) return false;
  try {
    return crypto.timingSafeEqual(digest, sig);
  } catch {
    return false;
  }
}

export type LemonWebhookOrderPaid = {
  ok: true;
  merchantOrderId: string;
  eventName: string;
} | { ok: false };

/**
 * Paid order with custom_data.merchant_order_id passed via checkout URL (see create-order global flow).
 */
export function parseLemonOrderPaidPayload(payload: unknown): LemonWebhookOrderPaid {
  if (!payload || typeof payload !== "object") return { ok: false };
  const p = payload as Record<string, unknown>;
  const meta = p.meta as Record<string, unknown> | undefined;
  const data = p.data as Record<string, unknown> | undefined;
  const attrs = data?.attributes as Record<string, unknown> | undefined;
  const custom = meta?.custom_data as Record<string, unknown> | undefined;
  const eventName = typeof meta?.event_name === "string" ? meta.event_name : "";
  const mid = typeof custom?.merchant_order_id === "string" ? custom.merchant_order_id.trim() : "";
  if (!mid.startsWith("te_")) return { ok: false };
  const status = typeof attrs?.status === "string" ? attrs.status : "";
  if (status !== "paid") return { ok: false };
  return { ok: true, merchantOrderId: mid, eventName };
}

/** Append checkout[custom][merchant_order_id] for Lemon checkout links. */
export function appendLemonCheckoutMerchantOrderId(checkoutUrl: string, publicOrderId: string): string {
  try {
    const u = new URL(checkoutUrl);
    u.searchParams.set("checkout[custom][merchant_order_id]", publicOrderId);
    return u.toString();
  } catch {
    const sep = checkoutUrl.includes("?") ? "&" : "?";
    return `${checkoutUrl}${sep}checkout%5Bcustom%5D%5Bmerchant_order_id%5D=${encodeURIComponent(publicOrderId)}`;
  }
}
