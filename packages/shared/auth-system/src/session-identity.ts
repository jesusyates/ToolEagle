export type AccountIdentity = {
  id: string;
  email?: string;
  /** Display name (unified from profile / metadata). */
  name?: string;
  /**
   * From shared-core session JSON when present. Drives verification policy (esp. Google OAuth).
   * Omitted = legacy payloads (non-OAuth flows still verify via gate + identity only).
   */
  sessionVerified?: boolean;
};

function pickString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function logRawSessionBody(json: unknown): void {
  if (typeof window === "undefined" || process.env.NODE_ENV !== "development") return;
  try {
    console.log("[identity-map] raw session body:", JSON.stringify(json));
  } catch {
    console.log("[identity-map] raw session body:", json);
  }
}

function buildIdentityLayers(root: Record<string, unknown>): Record<string, unknown>[] {
  const layers: Record<string, unknown>[] = [];
  const push = (o: Record<string, unknown> | null | undefined) => {
    if (o) layers.push(o);
  };

  const data = asRecord(root.data);
  const session = data ? asRecord(data.session) : null;
  push(asRecord(session?.user));
  push(asRecord(data?.user));
  push(data);
  push(asRecord(root.user));

  const metaFromRoot = asRecord(root.meta);
  const metaFromData = data ? asRecord(data.meta) : null;
  push(asRecord(metaFromRoot?.user));
  push(asRecord(metaFromData?.user));
  push(metaFromRoot);
  push(metaFromData);

  push(root);
  return layers;
}

function pickFirstString(layers: Record<string, unknown>[], keys: string[]): string | undefined {
  for (const key of keys) {
    for (const layer of layers) {
      const s = pickString(layer[key]);
      if (s) return s;
    }
  }
  return undefined;
}

function pickNameFromUserMetadata(layers: Record<string, unknown>[]): string | undefined {
  for (const layer of layers) {
    const um = layer.user_metadata;
    if (!um || typeof um !== "object") continue;
    const o = um as Record<string, unknown>;
    const n =
      pickString(o.displayName) ??
      pickString(o.display_name) ??
      pickString(o.name) ??
      pickString(o.full_name) ??
      pickString(o.fullName);
    if (n) return n;
  }
  return undefined;
}

const ID_KEYS = ["id", "user_id", "userId", "sub", "uuid"];
const EMAIL_KEYS = ["email", "mail"];
const NAME_KEYS = ["displayName", "display_name", "name", "full_name", "fullName"];

const SESSION_VERIFIED_KEYS = [
  "sessionVerified",
  "session_verified",
  "sessionReady",
  "session_ready",
  "accountVerified",
  "account_verified",
  "isVerified",
  "is_verified"
] as const;

/** Prefer explicit account fields; avoid generic `status` on unrelated objects. */
const ACCOUNT_STATUS_KEYS = ["accountStatus", "account_status"] as const;

const ACCOUNT_STATUS_DENY = new Set(["pending", "blocked", "new", "disabled", "suspended", "unverified"]);
const ACCOUNT_STATUS_ALLOW = new Set(["active", "approved", "verified", "ok"]);

/** Any explicit false wins; else any true wins; else undefined. */
function mergeVerificationBooleans(...vals: (boolean | undefined)[]): boolean | undefined {
  let seenTrue = false;
  for (const v of vals) {
    if (v === false) return false;
    if (v === true) seenTrue = true;
  }
  return seenTrue ? true : undefined;
}

function pickSessionVerifiedFlags(layers: Record<string, unknown>[]): boolean | undefined {
  let seenTrue = false;
  for (const layer of layers) {
    for (const key of SESSION_VERIFIED_KEYS) {
      const v = layer[key];
      if (v === false) return false;
      if (v === true) seenTrue = true;
    }
  }
  return seenTrue ? true : undefined;
}

function pickAccountStatusVerification(layers: Record<string, unknown>[]): boolean | undefined {
  for (const key of ACCOUNT_STATUS_KEYS) {
    for (const layer of layers) {
      const raw = layer[key];
      if (typeof raw !== "string" || !raw.trim()) continue;
      const s = raw.trim().toLowerCase();
      if (ACCOUNT_STATUS_DENY.has(s)) return false;
      if (ACCOUNT_STATUS_ALLOW.has(s)) return true;
    }
  }
  return undefined;
}

/**
 * Map shared-core GET /v1/account/session JSON to a stable identity.
 * Supports: { user }, { data: { user } }, { data }, { success, data, meta }, flat root, camelCase names.
 * Success: at least one of id or email is present (non-empty string).
 */
export function mapSessionResponseToIdentity(json: unknown): AccountIdentity | null {
  logRawSessionBody(json);

  if (!json || typeof json !== "object") return null;
  const root = json as Record<string, unknown>;

  const layers = buildIdentityLayers(root);

  const email = pickFirstString(layers, EMAIL_KEYS);
  const idRaw = pickFirstString(layers, ID_KEYS);
  const name =
    pickFirstString(layers, NAME_KEYS) ?? pickNameFromUserMetadata(layers) ?? undefined;

  const hasId = !!idRaw;
  const hasEmail = !!email;
  if (!hasId && !hasEmail) return null;

  const id = idRaw ?? email ?? "";

  const sessionVerified = mergeVerificationBooleans(
    pickSessionVerifiedFlags(layers),
    pickAccountStatusVerification(layers)
  );

  return {
    id,
    email: email ?? undefined,
    name,
    ...(sessionVerified !== undefined ? { sessionVerified } : {})
  };
}
