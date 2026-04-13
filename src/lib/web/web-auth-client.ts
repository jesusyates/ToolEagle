"use client";

/**
 * Web integration: shared-core auth gate (session) only.
 * Used by AuthProvider — do not add account/entitlements here.
 */
import { apiClient } from "@/lib/api/shared-core-client";
import { sessionGateFromHttpResponse, type AccountIdentity } from "@tooleagle/auth-system";

/**
 * GET /v1/account/session with Bearer. Used only by the auth pipeline (AuthProvider).
 */
export async function fetchAccountSessionGate(
  accessToken: string | null | undefined
): Promise<{
  ok: boolean;
  status: number;
  identity: AccountIdentity | null;
  responseTopKeys: string[];
}> {
  const token =
    typeof accessToken === "string" && accessToken.trim().length > 0 ? accessToken.trim() : "";
  if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    console.log("[auth-gate] sending with token:", token ? "yes" : "no");
  }
  if (!token) {
    return sessionGateFromHttpResponse(null, false, 0, null);
  }
  const res = await apiClient.getAccountSession(token);
  let json: unknown = null;
  try {
    json = await res.json().catch(() => null);
  } catch {
    json = null;
  }
  return sessionGateFromHttpResponse(token, res.ok, res.status, json);
}

export function resetSharedCoreSessionDebugLog(): void {
  try {
    sessionStorage.removeItem("te_sc_dbg_no_token");
    sessionStorage.removeItem("te_sc_dbg_fetch");
  } catch {
    /* ignore */
  }
}
