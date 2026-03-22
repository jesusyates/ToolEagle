import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listPaidDonationsForSupporterKey } from "@/lib/payment/donation-orders";
import { perksFromStats, THANK_YOU_DEFAULT } from "@/lib/supporter/supporter-perks";
import {
  applySupporterIdCookie,
  newSupporterId,
  readSupporterIdFromCookieStore
} from "@/lib/supporter/supporter-id";

/**
 * V101.1 — History from paid `orders` (order_type=donation) only; no manual ledger.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let supporterKey: string;
  let setNewSupporterCookie = false;

  if (user) {
    supporterKey = user.id;
  } else {
    const existing = readSupporterIdFromCookieStore(request.cookies);
    if (existing) {
      supporterKey = existing;
    } else {
      supporterKey = newSupporterId();
      setNewSupporterCookie = true;
    }
  }

  const paidRows = await listPaidDonationsForSupporterKey(supporterKey, user ? "auth" : "anon");
  let sum = 0;
  for (const e of paidRows) {
    if (Number.isFinite(e.amount)) sum += e.amount;
  }
  const stats = { count: paidRows.length, sum };
  const perks = perksFromStats(stats.count, stats.sum);

  const res = NextResponse.json({
    entries: paidRows.map((e) => ({
      id: e.id,
      amount: e.amount,
      channel: null as string | null,
      source_page: "verified_payment",
      message: THANK_YOU_DEFAULT,
      created_at: e.paid_at ?? e.created_at,
      order_id: e.order_id
    })),
    stats,
    level: perks.level,
    perks: {
      dailyGenerationBonus: perks.dailyGenerationBonus,
      freeVisibleExtraSlots: perks.freeVisibleExtraSlots,
      earlyFeatureAccess: perks.earlyFeatureAccess
    },
    acknowledgments: paidRows.map((e) => ({
      at: e.paid_at ?? e.created_at,
      message: THANK_YOU_DEFAULT
    }))
  });

  if (setNewSupporterCookie) {
    applySupporterIdCookie(res, supporterKey);
  }

  return res;
}
