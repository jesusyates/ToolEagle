/**
 * V101.1 — Paid donation orders only (no manual ledger).
 */

import { createAdminClient } from "@/lib/supabase/admin";

export type PaidDonationEntry = {
  id: string;
  order_id: string;
  amount: number;
  created_at: string;
  paid_at: string | null;
};

function admin() {
  return createAdminClient();
}

export type DonationIdentityMode = "auth" | "anon" | "either";

/** Paid donation orders. Use `either` when identity column unknown (e.g. perks); auth/anon from session when listing. */
export async function listPaidDonationsForSupporterKey(
  supporterKey: string,
  identity: DonationIdentityMode = "either"
): Promise<PaidDonationEntry[]> {
  try {
    const supabase = admin();
    let q = supabase
      .from("orders")
      .select("id, order_id, amount, created_at, paid_at")
      .eq("order_type", "donation")
      .eq("status", "paid");

    if (identity === "auth") {
      q = q.eq("user_id", supporterKey);
    } else if (identity === "anon") {
      q = q.eq("anonymous_user_id", supporterKey);
    } else {
      q = q.or(`user_id.eq.${supporterKey},anonymous_user_id.eq.${supporterKey}`);
    }

    const { data, error } = await q.order("paid_at", { ascending: false }).limit(100);

    if (error || !data) {
      console.error("[donation-orders] list", error?.message);
      return [];
    }

    return (data as { id: string; order_id: string; amount: number; created_at: string; paid_at: string | null }[]).map(
      (r) => ({
        id: r.id,
        order_id: r.order_id,
        amount: Number(r.amount),
        created_at: r.created_at,
        paid_at: r.paid_at
      })
    );
  } catch (e) {
    console.error("[donation-orders]", e);
    return [];
  }
}

export async function aggregateDonationOrdersForSupporterKey(
  supporterKey: string | null
): Promise<{ count: number; sum: number }> {
  if (!supporterKey) return { count: 0, sum: 0 };
  const rows = await listPaidDonationsForSupporterKey(supporterKey, "either");
  let sum = 0;
  for (const r of rows) {
    if (Number.isFinite(r.amount)) sum += r.amount;
  }
  return { count: rows.length, sum };
}
