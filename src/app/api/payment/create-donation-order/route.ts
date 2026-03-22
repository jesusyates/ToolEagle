import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { getPaymentProvider, isAggregatorConfigured } from "@/lib/payment/router";
import type { PaymentMarket } from "@/lib/payment/types";
import { insertOrder, updateOrderProviderPayload } from "@/lib/payment/orders-repository";
import { aggregatorCreatePayment } from "@/lib/payment/providers/aggregator";
import {
  applySupporterIdCookie,
  newSupporterId,
  readSupporterIdFromCookieStore
} from "@/lib/supporter/supporter-id";
import { DONATION_TIER_AMOUNTS_CNY, isValidDonationAmountCny } from "@/lib/payment/donation-config";

/**
 * V101.1 — Verified donation: preset CNY tiers, same aggregator + callback as Pro.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const market = typeof body.market === "string" ? (body.market as PaymentMarket) : "cn";
    const rawAmount = typeof body.amount === "number" ? body.amount : Number.NaN;
    const amount = Math.round(rawAmount * 100) / 100;

    if (market !== "cn") {
      return NextResponse.json({ error: "donation_cn_only" }, { status: 400 });
    }
    if (!isValidDonationAmountCny(amount)) {
      return NextResponse.json(
        { error: "invalid_amount", allowed: [...DONATION_TIER_AMOUNTS_CNY] },
        { status: 400 }
      );
    }

    const provider = getPaymentProvider(market);
    if (provider !== "aggregator") {
      return NextResponse.json({ error: "unexpected_provider" }, { status: 500 });
    }

    if (!isAggregatorConfigured()) {
      return NextResponse.json(
        {
          error: "aggregator_not_configured",
          hint: "Set AGGREGATOR_BASE_URL and AGGREGATOR_API_KEY."
        },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    let anonymousUserId: string | null = null;
    let userId: string | null = null;
    let setSupporterCookie = false;

    if (user) {
      userId = user.id;
    } else {
      const existing = readSupporterIdFromCookieStore(request.cookies);
      if (existing) {
        anonymousUserId = existing;
      } else {
        anonymousUserId = newSupporterId();
        setSupporterCookie = true;
      }
    }

    const publicOrderId = `te_d_${randomUUID().replace(/-/g, "")}`;

    const ins = await insertOrder({
      order_id: publicOrderId,
      user_id: userId,
      anonymous_user_id: anonymousUserId,
      market: "cn",
      amount,
      currency: "CNY",
      plan: "donation",
      order_type: "donation",
      status: "pending",
      provider: "aggregator",
      provider_payload: {}
    });

    if (!ins.ok) {
      return NextResponse.json({ error: "order_create_failed", detail: ins.error }, { status: 503 });
    }

    let pay: Awaited<ReturnType<typeof aggregatorCreatePayment>>;
    try {
      pay = await aggregatorCreatePayment({
        merchantOrderId: publicOrderId,
        amountCny: amount,
        subject: `ToolEagle 打赏 ¥${amount}`
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "aggregator_error";
      return NextResponse.json({ error: "aggregator_create_failed", detail: msg }, { status: 502 });
    }

    const payload = {
      ...(typeof pay.rawResponse === "object" && pay.rawResponse !== null
        ? (pay.rawResponse as Record<string, unknown>)
        : {}),
      _resolved_qr: pay.paymentQrUrl,
      _resolved_pay_url: pay.paymentUrl
    };

    await updateOrderProviderPayload(ins.id, payload, pay.providerOrderRef);

    const res = NextResponse.json({
      ok: true,
      orderId: publicOrderId,
      amount,
      currency: "CNY",
      plan: "donation",
      orderType: "donation",
      market: "cn",
      provider: "aggregator",
      paymentQrUrl: pay.paymentQrUrl,
      paymentUrl: pay.paymentUrl
    });

    if (setSupporterCookie && anonymousUserId) {
      applySupporterIdCookie(res, anonymousUserId);
    }

    return res;
  } catch (e) {
    console.error("[payment/create-donation-order]", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
