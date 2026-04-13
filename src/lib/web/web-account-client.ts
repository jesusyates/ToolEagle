"use client";

/**
 * Web integration: shared-core account reads (identity, entitlements).
 * Not used by AuthProvider gate — billing / profile helpers only.
 */
import { apiClient } from "@/lib/api/shared-core-client";
import { getSupabaseAccessToken } from "@/lib/auth/supabase-access-token";
import { mapEntitlementsToCreditsSummary, mapEntitlementsToExpireAt } from "@/lib/account/shared-core-entitlements";
import { mapSessionResponseToIdentity, type AccountIdentity } from "@tooleagle/auth-system";

export type { AccountIdentity };

export async function fetchAccountIdentity(accessToken?: string | null): Promise<AccountIdentity | null> {
  const token =
    typeof accessToken === "string" && accessToken.length > 0
      ? accessToken
      : await getSupabaseAccessToken();

  if (!token) return null;

  const res = await apiClient.getAccountSession(token);

  let parsed: AccountIdentity | null = null;
  try {
    const json = await res.json().catch(() => null);
    parsed = mapSessionResponseToIdentity(json);
  } catch {
    parsed = null;
  }

  if (!res.ok) return null;
  return parsed;
}

export async function fetchAccountEntitlementsPayload(
  accessToken?: string | null
): Promise<{
  raw: unknown;
  credits: ReturnType<typeof mapEntitlementsToCreditsSummary>;
  expireAt: string | null;
} | null> {
  const token =
    typeof accessToken === "string" && accessToken.length > 0
      ? accessToken
      : await getSupabaseAccessToken();
  if (!token) return null;
  const res = await apiClient.getAccountEntitlements(token);
  if (!res.ok) return null;
  const raw = await res.json().catch(() => null);
  if (raw == null) return null;
  return {
    raw,
    credits: mapEntitlementsToCreditsSummary(raw),
    expireAt: mapEntitlementsToExpireAt(raw)
  };
}
