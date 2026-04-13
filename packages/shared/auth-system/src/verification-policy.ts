import type { AccountIdentity } from "./session-identity";
import type { SessionGateSnapshot } from "./session-gate";

function identityHasIdOrEmail(identity: AccountIdentity | null): boolean {
  if (!identity) return false;
  return !!(identity.id?.trim() || identity.email?.trim());
}

/**
 * After shared-core session gate: HTTP success + identity are necessary but not sufficient.
 * Google OAuth requires an explicit allow signal from the gate payload (see session-identity mapping).
 * Password / email flows keep legacy behavior when the payload omits verification flags.
 */
export function isVerifiedAccount(
  identity: AccountIdentity | null,
  gate: Pick<SessionGateSnapshot, "ok" | "status">,
  options?: { oauthGoogle?: boolean }
): boolean {
  if (!gate.ok || gate.status !== 200) return false;
  if (!identityHasIdOrEmail(identity)) return false;

  const sv = identity?.sessionVerified;
  if (sv === false) return false;
  if (sv === true) return true;

  if (options?.oauthGoogle) return false;
  return true;
}
