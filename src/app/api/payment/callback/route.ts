import { NextRequest, NextResponse } from "next/server";
import {
  parseAggregatorCallbackBody,
  verifyAggregatorSignature
} from "@/lib/payment/providers/aggregator";
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
    await insertPaymentEvent({
      orderId: existingOrder.id,
      eventType: parsed.paid ? "payment_paid_callback" : "payment_ignored_callback",
      provider: "aggregator",
      payload: parsed as unknown as Record<string, unknown>
    });
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

  const act = await activateMembershipFromPaidOrder(transitioned);
  if (!act.ok) {
    console.error("[payment/callback] activate failed", act.error, transitioned.order_id);
    return new NextResponse("activate failed", { status: 500 });
  }

  return new NextResponse("success", { status: 200 });
}
