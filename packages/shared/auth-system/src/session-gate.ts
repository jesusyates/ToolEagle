import { mapSessionResponseToIdentity, type AccountIdentity } from "./session-identity";

/** Normalized GET /v1/account/session gate outcome (shared-core is truth; this only parses HTTP + JSON). */
export type SessionGateSnapshot = {
  ok: boolean;
  status: number;
  identity: AccountIdentity | null;
  responseTopKeys: string[];
};

/**
 * Build gate snapshot from fetch result. Empty/missing Bearer → same as legacy Web (ok false, status 0).
 */
export function sessionGateFromHttpResponse(
  accessToken: string | null | undefined,
  resOk: boolean,
  httpStatus: number,
  json: unknown
): SessionGateSnapshot {
  const token =
    typeof accessToken === "string" && accessToken.trim().length > 0 ? accessToken.trim() : "";
  if (!token) {
    return { ok: false, status: 0, identity: null, responseTopKeys: [] };
  }
  const responseTopKeys =
    json && typeof json === "object" ? Object.keys(json as Record<string, unknown>) : [];
  const identity = mapSessionResponseToIdentity(json);
  return {
    ok: resOk,
    status: httpStatus,
    identity: resOk ? identity : null,
    responseTopKeys
  };
}
