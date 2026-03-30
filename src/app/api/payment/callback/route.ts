import { NextRequest, NextResponse } from "next/server";
import {
  parseAggregatorCallbackBody,
  verifyAggregatorSignature
} from "@/lib/payment/providers/aggregator";
import { extractV180AttributionFromProviderPayload } from "@/lib/payment/order-attribution";
import { getOrderByPublicId, insertPaymentEvent, markOrderPaidIfPending } from "@/lib/payment/orders-repository";
import { activateMembershipFromPaidOrder } from "@/lib/payment/activateMembership";

/**
 * Aggregator server-to-server notify. Returns plain `success` when accepted (common CN convention).
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  const contentType = request.headers.get("content-type") || "";

  const sig =
    request.headers.get("x-aggregator-signature") ||
    request.headers.get("x-signature") ||
    request.headers.get("X-Signature") ||
    null;

  if (!verifyAggregatorSignature(raw, sig)) {
    return new NextResponse("invalid signature", { status: 401 });
  }

  const parsed = parseAggregatorCallbackBody(raw, contentType);
  if (!parsed.merchantOrderId) {
    return new NextResponse("missing order", { status: 400 });
  }

  const existingOrder = await getOrderByPublicId(parsed.merchantOrderId);
  if (existingOrder) {
    const pp = existingOrder.provider_payload as Record<string, unknown> | undefined;
    const v180 = extractV180AttributionFromProviderPayload(pp, {
      order_id: existingOrder.order_id,
      market: String(existingOrder.market || "cn"),
      plan: String(existingOrder.plan || existingOrder.package_id || "unknown"),
      anonymous_or_user: existingOrder.user_id
        ? "user"
        : existingOrder.anonymous_user_id
          ? "anonymous"
          : "unknown"
    });
    const basePayload = parsed as unknown as Record<string, unknown>;
    const ev1 = await insertPaymentEvent({
      orderId: existingOrder.id,
      eventType: parsed.paid ? "payment_paid_callback" : "payment_ignored_callback",
      provider: "aggregator",
      payload: {
        ...basePayload,
        v180_attribution: { ...v180, attribution_source: "callback_payload" as const },
        attribution_key: v180.attribution_key
      }
    });
    if (!ev1.ok) {
      console.error("[payment/callback] payment_events insert failed", ev1.error);
      return new NextResponse("db write failed", { status: 500 });
    }
  }

  if (!parsed.paid) {
    return new NextResponse("ignored", { status: 200 });
  }

  const transitioned = await markOrderPaidIfPending(parsed.merchantOrderId);

  if (!transitioned) {
    const existing = await getOrderByPublicId(parsed.merchantOrderId);
    if (existing?.status === "paid") {
      return new NextResponse("success", { status: 200 });
    }
    return new NextResponse("order not found", { status: 404 });
  }

  const ppPaid = transitioned.provider_payload as Record<string, unknown> | undefined;
  const v180Paid = extractV180AttributionFromProviderPayload(ppPaid, {
    order_id: transitioned.order_id,
    market: String(transitioned.market || "cn"),
    plan: String(transitioned.plan || transitioned.package_id || "unknown"),
    anonymous_or_user: transitioned.user_id
      ? "user"
      : transitioned.anonymous_user_id
        ? "anonymous"
        : "unknown"
  });
  const evPaid = await insertPaymentEvent({
    orderId: transitioned.id,
    eventType: "payment_callback_success",
    provider: "aggregator",
    payload: {
      v180_attribution: { ...v180Paid, attribution_source: "callback_payload" as const },
      attributed_stage: "payment_success"
    }
  });
  if (!evPaid.ok) {
    console.error("[payment/callback] payment_callback_success insert failed", evPaid.error);
    return new NextResponse("db write failed", { status: 500 });
  }

  const act = await activateMembershipFromPaidOrder(transitioned);
  if (!act.ok) {
    console.error("[payment/callback] activate failed", act.error, transitioned.order_id);
    return new NextResponse("activate failed", { status: 500 });
  }

  const ot = transitioned.order_type ?? (transitioned.plan === "donation" ? "donation" : "credits");
  if (ot === "credits") {
    const pp2 = transitioned.provider_payload as Record<string, unknown> | undefined;
    const v180Act = extractV180AttributionFromProviderPayload(pp2, {
      order_id: transitioned.order_id,
      market: String(transitioned.market || "cn"),
      plan: String(transitioned.plan || transitioned.package_id || "unknown"),
      anonymous_or_user: transitioned.user_id
        ? "user"
        : transitioned.anonymous_user_id
          ? "anonymous"
          : "unknown"
    });
    const ev2 = await insertPaymentEvent({
      orderId: transitioned.id,
      eventType: "membership_activated",
      provider: "system",
      payload: {
        v180_attribution: { ...v180Act, attribution_source: "callback_payload" },
        attribution_key: v180Act.attribution_key,
        order_id: transitioned.order_id
      }
    });
    if (!ev2.ok) {
      console.error("[payment/callback] membership_activated event insert failed", ev2.error);
      return new NextResponse("db write failed", { status: 500 });
    }
  }

  return new NextResponse("success", { status: 200 });
}
