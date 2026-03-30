import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { getPaymentProvider, isAggregatorConfigured } from "@/lib/payment/router";
import type { OrderPlan, PaymentMarket } from "@/lib/payment/types";
import { insertOrder, updateOrderProviderPayload } from "@/lib/payment/orders-repository";
import type { AnonymousOrUser } from "@/lib/payment/order-attribution";
import {
  buildV180AttributionForCreateOrder,
  mergeProviderPayload,
  v180AttributionToProviderPayloadPatch
} from "@/lib/payment/order-attribution";
import { aggregatorCreatePayment } from "@/lib/payment/providers/aggregator";
import { appendLemonCheckoutMerchantOrderId } from "@/lib/payment/providers/lemon";
import { getCreditPackage } from "@/lib/billing/package-config";
import {
  applySupporterIdCookie,
  newSupporterId,
  readSupporterIdFromCookieStore
} from "@/lib/supporter/supporter-id";
import { DONATION_TIER_AMOUNTS_CNY, isValidDonationAmountCny } from "@/lib/payment/donation-config";
import { hasServiceRoleKey } from "@/lib/supabase/admin";

function orderSubjectForPackage(displayName: string, orderType: "credits" | "donation") {
  return orderType === "donation" ? `ToolEagle Donation` : `ToolEagle Credits · ${displayName}`;
}

export async function POST(request: NextRequest) {
  try {
    if (!hasServiceRoleKey()) {
      return NextResponse.json(
        {
          error: "order_create_failed",
          detail: "missing_SUPABASE_SERVICE_ROLE_KEY",
          hint: "Set SUPABASE_SERVICE_ROLE_KEY in .env.local and restart dev server."
        },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const packageId = typeof body.package_id === "string" ? body.package_id : "";
    const market = typeof body.market === "string" ? (body.market as PaymentMarket) : "cn";
    const orderType = body.order_type === "donation" ? "donation" : "credits";
    const returnUrl = typeof body.return_url === "string" ? body.return_url : null;

    const pack = getCreditPackage(market, packageId);
    if (orderType === "credits" && !pack) {
      return NextResponse.json({ error: "invalid_package_id" }, { status: 400 });
    }

    const provider = getPaymentProvider(market);

    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    let userId: string | null = null;
    let anonymousUserId: string | null = null;
    let setSupporterCookie = false;
    if (orderType === "credits") {
      if (!user) {
        return NextResponse.json(
          { error: "login_required", hint: "Sign in before purchasing credits." },
          { status: 401 }
        );
      }
      userId = user.id;
    } else {
      if (user) {
        userId = user.id;
      } else {
        const existing = readSupporterIdFromCookieStore(request.cookies);
        if (existing) anonymousUserId = existing;
        else {
          anonymousUserId = newSupporterId();
          setSupporterCookie = true;
        }
      }
    }

    const amount = orderType === "donation" ? Number(body.amount ?? 0) : Number(pack?.amount ?? 0);
    const currency = orderType === "donation" ? (market === "cn" ? "CNY" : "USD") : (pack?.currency ?? (market === "cn" ? "CNY" : "USD"));
    if (amount <= 0) return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
    if (orderType === "donation" && market === "cn" && !isValidDonationAmountCny(amount)) {
      return NextResponse.json({ error: "invalid_amount", allowed: [...DONATION_TIER_AMOUNTS_CNY] }, { status: 400 });
    }
    const publicOrderId = `te_${randomUUID().replace(/-/g, "")}`;

    const planStr =
      orderType === "donation" ? "donation" : String(packageId || (pack?.display_name ?? "credits"));
    const anonymousOrUser: AnonymousOrUser = userId
      ? "user"
      : anonymousUserId
        ? "anonymous"
        : "unknown";

    const refererHeader = request.headers.get("referer") || request.headers.get("referrer");
    const v180 = buildV180AttributionForCreateOrder({
      body: body as Record<string, unknown>,
      refererHeader,
      orderPublicId: publicOrderId,
      market,
      plan: planStr,
      anonymousOrUser,
      returnUrl
    });
    const attributionPatch = v180AttributionToProviderPayloadPatch(v180);

    const ins = await insertOrder({
      order_id: publicOrderId,
      user_id: userId,
      anonymous_user_id: anonymousUserId,
      market,
      amount,
      currency,
      plan: (orderType === "donation" ? "donation" : (packageId as OrderPlan)) as OrderPlan,
      package_id: packageId || null,
      credits_total: orderType === "credits" ? pack?.credits_total ?? null : null,
      order_type: orderType,
      status: "pending",
      provider,
      provider_payload: { ...attributionPatch }
    });

    if (!ins.ok) {
      return NextResponse.json({ error: "order_create_failed", detail: ins.error }, { status: 503 });
    }

    if (provider !== "aggregator") {
      let paymentUrl = (process.env.NEXT_PUBLIC_PAYMENT_LINK || "").trim() || returnUrl || "";
      if (paymentUrl) {
        paymentUrl = appendLemonCheckoutMerchantOrderId(paymentUrl, publicOrderId);
      }
      if (!paymentUrl) {
        return NextResponse.json(
          {
            error: "global_checkout_not_configured",
            detail: "missing_NEXT_PUBLIC_PAYMENT_LINK",
            hint: "Set NEXT_PUBLIC_PAYMENT_LINK to your global checkout URL."
          },
          { status: 503 }
        );
      }
      await updateOrderProviderPayload(
        ins.id,
        mergeProviderPayload(attributionPatch, {
          payment_url: paymentUrl,
          return_url: returnUrl
        })
      );
      const response = NextResponse.json({
        ok: true,
        orderId: publicOrderId,
        amount,
        currency,
        package_id: packageId,
        market,
        order_type: orderType,
        provider,
        paymentUrl
      });
      if (setSupporterCookie && anonymousUserId) applySupporterIdCookie(response, anonymousUserId);
      return response;
    }

    if (!isAggregatorConfigured()) {
      return NextResponse.json(
        {
          error: "aggregator_not_configured",
          hint: "Set AGGREGATOR_BASE_URL and AGGREGATOR_API_KEY (and AGGREGATOR_NOTIFY_URL in production)."
        },
        { status: 503 }
      );
    }

    let pay: Awaited<ReturnType<typeof aggregatorCreatePayment>>;
    try {
      pay = await aggregatorCreatePayment({
        merchantOrderId: publicOrderId,
        amountCny: amount,
        subject: orderSubjectForPackage(pack?.display_name ?? packageId, orderType)
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "aggregator_error";
      return NextResponse.json({ error: "aggregator_create_failed", detail: msg }, { status: 502 });
    }

    const payload = mergeProviderPayload(attributionPatch, {
      ...(typeof pay.rawResponse === "object" && pay.rawResponse !== null
        ? (pay.rawResponse as Record<string, unknown>)
        : {}),
      _resolved_qr: pay.paymentQrUrl,
      _resolved_pay_url: pay.paymentUrl
    });
    await updateOrderProviderPayload(ins.id, payload, pay.providerOrderRef);

    const response = NextResponse.json({
      ok: true,
      orderId: publicOrderId,
      amount,
      currency,
      package_id: packageId,
      market,
      order_type: orderType,
      provider,
      paymentQrUrl: pay.paymentQrUrl,
      paymentUrl: pay.paymentUrl
    });
    if (setSupporterCookie && anonymousUserId) applySupporterIdCookie(response, anonymousUserId);
    return response;
  } catch (e) {
    console.error("[payment/create-order]", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
