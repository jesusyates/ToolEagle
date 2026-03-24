import { createAdminClient } from "@/lib/supabase/admin";
import type { OrderKind, OrderPlan, OrderStatus } from "./types";

export type OrderRow = {
  id: string;
  order_id: string;
  user_id: string | null;
  anonymous_user_id: string | null;
  market: string;
  amount: number;
  currency: string;
  plan: string;
  package_id: string | null;
  status: OrderStatus;
  order_type: OrderKind;
  provider: string;
  provider_order_ref: string | null;
  provider_payload: Record<string, unknown>;
  credits_total: number | null;
  expire_at: string | null;
  updated_at: string;
  created_at: string;
  paid_at: string | null;
};

function admin() {
  return createAdminClient();
}

export async function insertOrder(row: {
  order_id: string;
  user_id: string | null;
  anonymous_user_id: string | null;
  market: "cn" | "global";
  amount: number;
  currency: "CNY" | "USD";
  plan: OrderPlan;
  package_id?: string | null;
  credits_total?: number | null;
  expire_at?: string | null;
  order_type?: OrderKind;
  status: OrderStatus;
  provider: string;
  provider_order_ref?: string | null;
  provider_payload?: Record<string, unknown>;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const supabase = admin();
    const orderType = row.order_type ?? (row.plan === "donation" ? "donation" : "credits");
    const primaryInsert = await supabase
      .from("orders")
      .insert({
        order_id: row.order_id,
        user_id: row.user_id,
        anonymous_user_id: row.anonymous_user_id,
        market: row.market,
        amount: row.amount,
        currency: row.currency,
        plan: row.plan,
        package_id: row.package_id ?? null,
        credits_total: row.credits_total ?? null,
        expire_at: row.expire_at ?? null,
        order_type: orderType,
        status: row.status,
        provider: row.provider,
        provider_order_ref: row.provider_order_ref ?? null,
        provider_payload: row.provider_payload ?? {}
      })
      .select("id")
      .single();
    if (!primaryInsert.error && primaryInsert.data) {
      return { ok: true, id: primaryInsert.data.id as string };
    }

    const message = primaryInsert.error?.message ?? "insert_failed";
    const needsLegacyFallback =
      /column .* does not exist|schema cache|orders_order_type_check|violates check constraint/i.test(message);
    if (!needsLegacyFallback) {
      return { ok: false, error: message };
    }

    // Legacy fallback: tolerate old DB schemas before V115 migrations are applied.
    const legacyOrderType = orderType === "credits" ? "pro" : orderType;
    const fallbackInsert = await supabase
      .from("orders")
      .insert({
        order_id: row.order_id,
        user_id: row.user_id,
        anonymous_user_id: row.anonymous_user_id,
        market: row.market,
        amount: row.amount,
        currency: row.currency,
        plan: row.plan,
        order_type: legacyOrderType,
        status: row.status,
        provider: row.provider,
        provider_order_ref: row.provider_order_ref ?? null,
        provider_payload: row.provider_payload ?? {}
      })
      .select("id")
      .single();

    if (fallbackInsert.error || !fallbackInsert.data) {
      return { ok: false, error: fallbackInsert.error?.message ?? message };
    }
    return { ok: true, id: fallbackInsert.data.id as string };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "insert_failed" };
  }
}

export async function updateOrderProviderPayload(
  internalId: string,
  payload: Record<string, unknown>,
  providerRef?: string | null
): Promise<void> {
  const supabase = admin();
  const patch: Record<string, unknown> = { provider_payload: payload };
  if (providerRef !== undefined) patch.provider_order_ref = providerRef;
  await supabase.from("orders").update(patch).eq("id", internalId);
}

function normalizeOrderRow(data: Record<string, unknown>): OrderRow {
  const r = { ...(data as unknown as OrderRow) };
  if (!r.order_type) {
    if (r.plan === "donation") r.order_type = "donation";
    else r.order_type = "credits";
  }
  return r;
}

export async function getOrderByPublicId(publicOrderId: string): Promise<OrderRow | null> {
  const supabase = admin();
  const { data, error } = await supabase.from("orders").select("*").eq("order_id", publicOrderId).maybeSingle();
  if (error || !data) return null;
  return normalizeOrderRow(data as Record<string, unknown>);
}

/** Mark paid only if currently pending (idempotent safe). Returns row after transition or existing paid row. */
export async function markOrderPaidIfPending(publicOrderId: string): Promise<OrderRow | null> {
  const supabase = admin();
  const paidAt = new Date().toISOString();

  const { data: updated, error: upErr } = await supabase
    .from("orders")
    .update({ status: "paid", paid_at: paidAt, updated_at: paidAt })
    .eq("order_id", publicOrderId)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (!upErr && updated) {
    return normalizeOrderRow(updated as Record<string, unknown>);
  }

  const existing = await getOrderByPublicId(publicOrderId);
  if (existing?.status === "paid") return existing;
  return null;
}

export async function markOrderFailed(publicOrderId: string): Promise<void> {
  const supabase = admin();
  await supabase.from("orders").update({ status: "failed" }).eq("order_id", publicOrderId).eq("status", "pending");
}

export async function insertPaymentEvent(params: {
  orderId: string;
  eventType: string;
  provider: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  const supabase = admin();
  await supabase.from("payment_events").insert({
    order_id: params.orderId,
    event_type: params.eventType,
    provider: params.provider,
    payload_json: params.payload
  });
}
