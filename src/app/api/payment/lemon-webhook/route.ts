import { NextRequest, NextResponse } from "next/server";
import { extractV180AttributionFromProviderPayload } from "@/lib/payment/order-attribution";
import { getOrderByPublicId, insertPaymentEvent, markOrderPaidIfPending } from "@/lib/payment/orders-repository";
import { activateMembershipFromPaidOrder } from "@/lib/payment/activateMembership";
import { parseLemonOrderPaidPayload, verifyLemonSqueezyWebhookSignature } from "@/lib/payment/providers/lemon";

/**
 * Lemon Squeezy server webhook — global checkout (NEXT_PUBLIC_PAYMENT_LINK).
 * Configure webhook URL in Lemon dashboard to: https://<domain>/api/payment/lemon-webhook
 * Set LEMON_SQUEEZY_SIGNING_SECRET to the signing secret from Lemon.
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  const secret = (process.env.LEMON_SQUEEZY_SIGNING_SECRET || "").trim();
  if (!secret) {
    console.error("[payment/lemon-webhook] missing LEMON_SQUEEZY_SIGNING_SECRET");
    return new NextResponse("webhook not configured", { status: 503 });
  }

  const sig = request.headers.get("x-signature") || request.headers.get("X-Signature");
  if (!verifyLemonSqueezyWebhookSignature(raw, sig, secret)) {
    return new NextResponse("invalid signature", { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new NextResponse("bad json", { status: 400 });
  }

  const paid = parseLemonOrderPaidPayload(payload);
  if (!paid.ok) {
    return new NextResponse("ignored", { status: 200 });
  }

  const existingOrder = await getOrderByPublicId(paid.merchantOrderId);
  if (existingOrder) {
    const pp = existingOrder.provider_payload as Record<string, unknown> | undefined;
    const v180 = extractV180AttributionFromProviderPayload(pp, {
      order_id: existingOrder.order_id,
      market: String(existingOrder.market || "global"),
      plan: String(existingOrder.plan || existingOrder.package_id || "unknown"),
      anonymous_or_user: existingOrder.user_id ? "user" : existingOrder.anonymous_user_id ? "anonymous" : "unknown"
    });
    const ins = await insertPaymentEvent({
      orderId: existingOrder.id,
      eventType: "lemon_webhook_received",
      provider: "lemon",
      payload: {
        lemon_event: paid.eventName,
        v180_attribution: { ...v180, attribution_source: "callback_payload" as const },
        raw_meta: (payload as { meta?: unknown }).meta
      }
    });
    if (!ins.ok) {
      console.error("[payment/lemon-webhook] insertPaymentEvent failed", ins.error);
      return new NextResponse("db write failed", { status: 500 });
    }
  }

  const transitioned = await markOrderPaidIfPending(paid.merchantOrderId);
  if (!transitioned) {
    const existing = await getOrderByPublicId(paid.merchantOrderId);
    if (existing?.status === "paid") {
      return new NextResponse("success", { status: 200 });
    }
    return new NextResponse("order not found", { status: 404 });
  }

  const pp2 = transitioned.provider_payload as Record<string, unknown> | undefined;
  const v180Act = extractV180AttributionFromProviderPayload(pp2, {
    order_id: transitioned.order_id,
    market: String(transitioned.market || "global"),
    plan: String(transitioned.plan || transitioned.package_id || "unknown"),
    anonymous_or_user: transitioned.user_id ? "user" : transitioned.anonymous_user_id ? "anonymous" : "unknown"
  });
  const evPaid = await insertPaymentEvent({
    orderId: transitioned.id,
    eventType: "payment_callback_success",
    provider: "lemon",
    payload: {
      lemon_event: paid.eventName,
      v180_attribution: { ...v180Act, attribution_source: "callback_payload" },
      attributed_stage: "payment_success"
    }
  });
  if (!evPaid.ok) {
    console.error("[payment/lemon-webhook] payment_callback_success insert failed", evPaid.error);
    return new NextResponse("db write failed", { status: 500 });
  }

  const act = await activateMembershipFromPaidOrder(transitioned);
  if (!act.ok) {
    console.error("[payment/lemon-webhook] activate failed", act.error, transitioned.order_id);
    return new NextResponse("activate failed", { status: 500 });
  }

  const ot = transitioned.order_type ?? (transitioned.plan === "donation" ? "donation" : "credits");
  if (ot === "credits") {
    const evMem = await insertPaymentEvent({
      orderId: transitioned.id,
      eventType: "membership_activated",
      provider: "system",
      payload: {
        v180_attribution: { ...v180Act, attribution_source: "callback_payload" },
        attribution_key: v180Act.attribution_key,
        order_id: transitioned.order_id
      }
    });
    if (!evMem.ok) {
      console.error("[payment/lemon-webhook] membership_activated insert failed", evMem.error);
      return new NextResponse("db write failed", { status: 500 });
    }
  }

  return new NextResponse("success", { status: 200 });
}
