/**
 * V100.1 — Donation ledger (server-only; requires service role for writes/reads).
 */

import { createAdminClient } from "@/lib/supabase/admin";

export type DonationRow = {
  id: string;
  user_id: string;
  amount: number | null;
  created_at: string;
  source_page: string | null;
  thank_you_message: string | null;
  channel: string | null;
};

export async function insertDonationLedgerRow(input: {
  userId: string;
  amount?: number | null;
  sourcePage?: string | null;
  thankYouMessage?: string | null;
  channel?: string | null;
}): Promise<{ id: string } | { error: string }> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("donation_ledger")
      .insert({
        user_id: input.userId,
        amount: input.amount ?? null,
        source_page: input.sourcePage ?? null,
        thank_you_message: input.thankYouMessage ?? "感谢你的支持 ❤️",
        channel: input.channel ?? null
      })
      .select("id")
      .single();

    if (error) {
      console.error("[donation_ledger] insert", error.message);
      return { error: error.message };
    }
    return { id: data.id as string };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "insert_failed";
    console.error("[donation_ledger]", msg);
    return { error: msg };
  }
}

export async function listDonationsForUser(userId: string): Promise<DonationRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("donation_ledger")
    .select("id, user_id, amount, created_at, source_page, thank_you_message, channel")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[donation_ledger] list", error.message);
    return [];
  }
  return (data ?? []) as DonationRow[];
}

export async function aggregateDonationStats(userId: string): Promise<{ count: number; sum: number }> {
  const rows = await listDonationsForUser(userId);
  let sum = 0;
  for (const r of rows) {
    if (r.amount != null && Number.isFinite(Number(r.amount))) {
      sum += Number(r.amount);
    }
  }
  return { count: rows.length, sum };
}
