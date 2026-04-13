"use client";

import { fetchAccountEntitlementsPayload } from "@/lib/web/web-account-client";

/** Billing overview balance row — from shared-core entitlements (Phase 1). */
export async function fetchCreditsBalanceForUi(): Promise<{
  remaining_credits: number;
  total_credits: number;
  expire_at: string | null;
  wallet_type: "user" | "anonymous";
}> {
  const pack = await fetchAccountEntitlementsPayload();
  const c = pack?.credits;
  return {
    remaining_credits: c?.remaining ?? 0,
    total_credits: c?.total ?? 0,
    expire_at: pack?.expireAt ?? null,
    wallet_type: "user"
  };
}
