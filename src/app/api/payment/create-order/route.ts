import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { getPaymentProvider, isAggregatorConfigured } from "@/lib/payment/router";
import { amountForPlan } from "@/lib/payment/config";
import type { OrderPlan, PaymentMarket } from "@/lib/payment/types";
import { CN_CREDIT_PACK_IDS } from "@/lib/credits/credit-packs";
import { insertOrder, updateOrderProviderPayload } from "@/lib/payment/orders-repository";
import { aggregatorCreatePayment } from "@/lib/payment/providers/aggregator";

const PLANS: OrderPlan[] = ["pro_monthly", ...CN_CREDIT_PACK_IDS];

function orderSubjectForPlan(plan: OrderPlan): string {
  if (plan === "credits_starter") return "ToolEagle 算力包 · 入门 100 次";
  if (plan === "credits_standard") return "ToolEagle 算力包 · 标准 500 次";
  if (plan === "credits_advanced") return "ToolEagle 算力包 · 进阶 1200 次";
  if (plan === "credits_pro") return "ToolEagle 算力包 · 专业 2500 次";
  return "ToolEagle Pro 月付";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const plan = typeof body.plan === "string" ? (body.plan as OrderPlan) : "credits_standard";
    const market = typeof body.market === "string" ? (body.market as PaymentMarket) : "cn";

    if (!PLANS.includes(plan)) {
      return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
    }
    if (market !== "cn") {
      return NextResponse.json(
        { error: "global_checkout_use_payment_link", hint: "Use Lemon/Stripe checkout for non-CN market." },
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
          hint: "Set AGGREGATOR_BASE_URL and AGGREGATOR_API_KEY (and AGGREGATOR_NOTIFY_URL in production)."
        },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "login_required", hint: "Sign in before purchasing credits or Pro." },
        { status: 401 }
      );
    }

    const userId = user.id;

    const { amount, currency } = amountForPlan(plan, "cn");
    const publicOrderId = `te_${randomUUID().replace(/-/g, "")}`;

    const orderType = plan.startsWith("credits_") ? "credits" : "pro";

    const ins = await insertOrder({
      order_id: publicOrderId,
      user_id: userId,
      anonymous_user_id: null,
      market: "cn",
      amount,
      currency,
      plan,
      order_type: orderType,
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
        subject: orderSubjectForPlan(plan)
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

    return NextResponse.json({
      ok: true,
      orderId: publicOrderId,
      amount,
      currency,
      plan,
      market: "cn",
      provider: "aggregator",
      paymentQrUrl: pay.paymentQrUrl,
      paymentUrl: pay.paymentUrl
    });
  } catch (e) {
    console.error("[payment/create-order]", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
