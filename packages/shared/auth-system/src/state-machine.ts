import type { AccountIdentity } from "./session-identity";
import type { SessionGateSnapshot } from "./session-gate";
import { isVerifiedAccount } from "./verification-policy";

export type AuthStatus = "loading" | "guest" | "verified";

/** UI-facing identity (subset of account identity, optional fields). */
export type UiIdentity = { id?: string; email?: string; name?: string };

export function accountIdentityToUi(i: AccountIdentity | null): UiIdentity | null {
  if (!i) return null;
  return { id: i.id, email: i.email, name: i.name };
}

export function uiIdentityIsValid(i: UiIdentity | null): i is UiIdentity {
  return !!i && (!!i.id?.trim() || !!i.email?.trim());
}

export type ResolvedAuthFromGate =
  | {
      status: "verified";
      accessToken: string;
      identity: UiIdentity;
      gateStatus: number;
      error: null;
      debugGateResponseKeys: string;
      debugIdentityKeys: string;
    }
  | {
      status: "guest";
      accessToken: null;
      identity: null;
      gateStatus: number | null;
      error: string;
      debugGateResponseKeys: string;
      debugIdentityKeys: string;
    };

/**
 * Pure auth resolution: Supabase already accepted the user; shared-core gate decides verified vs guest.
 * Matches Web AuthProvider semantics (guest clears slice identity/token even if JWT exists elsewhere).
 */
export type ResolveAuthFromGateOptions = {
  oauthGoogle?: boolean;
};

export function resolveAuthFromGate(
  accessToken: string,
  gate: SessionGateSnapshot,
  options?: ResolveAuthFromGateOptions
): ResolvedAuthFromGate {
  const mapped = accountIdentityToUi(gate.identity);
  const okIdentity = uiIdentityIsValid(mapped);
  const policyOk = isVerifiedAccount(gate.identity, gate, { oauthGoogle: options?.oauthGoogle });

  if (gate.ok && okIdentity && mapped && policyOk) {
    return {
      status: "verified",
      accessToken,
      identity: mapped,
      gateStatus: gate.status,
      error: null,
      debugGateResponseKeys: gate.responseTopKeys.join(","),
      debugIdentityKeys: Object.keys(mapped).join(",")
    };
  }

  let err = "gate_failed";
  if (!gate.ok) err = `gate_http_${gate.status}`;
  else if (!okIdentity) err = "gate_identity_missing";
  else if (!policyOk) err = "gate_verification_denied";

  return {
    status: "guest",
    accessToken: null,
    identity: null,
    gateStatus: gate.status,
    error: err,
    debugGateResponseKeys: gate.responseTopKeys.join(","),
    debugIdentityKeys: mapped ? Object.keys(mapped).join(",") : ""
  };
}
