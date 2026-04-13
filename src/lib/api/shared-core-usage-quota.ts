/**
 * Web usage/quota: shared-core GET /v1/usage + /v1/quota (primary when Bearer present).
 * TEMP: GET /api/usage-status only when there is no Bearer (anonymous / cookie path) — not a silent fallback after core errors.
 */
import { apiClient } from "@/lib/api/shared-core-client";
import { parseUsageStatusForToolUi, type UsageStatusUiSlice } from "@/lib/usage-status-client";

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function pickNumber(...candidates: unknown[]): number | null {
  for (const c of candidates) {
    if (typeof c === "number" && Number.isFinite(c)) return c;
  }
  return null;
}

function pickString(...candidates: unknown[]): string | undefined {
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return undefined;
}

/** Walk common shapes: root, data, data.user, user, summary. */
function gatherFields(root: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const merge = (o: Record<string, unknown> | null) => {
    if (!o) return;
    for (const [k, v] of Object.entries(o)) {
      if (!(k in out) && v !== undefined) out[k] = v;
    }
  };
  const r = asRecord(root);
  merge(r);
  const data = asRecord(r?.data);
  merge(data);
  merge(asRecord(data?.user));
  merge(asRecord(r?.user));
  const summary = asRecord(data?.summary ?? r?.summary);
  merge(summary);
  return out;
}

/**
 * Map shared-core usage + quota JSON into the normalized payload shape for `parseUsageStatusForToolUi`.
 */
export function mapSharedCoreUsageQuotaToUsageStatusPayload(
  usageJson: unknown,
  quotaJson: unknown,
  hasBearer: boolean
): Record<string, unknown> {
  const u = gatherFields(usageJson);
  const q = gatherFields(quotaJson);
  const merged: Record<string, unknown> = { ...u, ...q };

  const limit = pickNumber(
    merged.limit,
    merged.daily_limit,
    merged.max,
    merged.quota_limit,
    q.limit,
    q.daily_limit
  );
  const used = pickNumber(merged.used, merged.consumed, merged.generations_count, u.used, u.generations_count);
  let remaining = pickNumber(
    merged.remaining,
    merged.remaining_count,
    merged.daily_remaining,
    q.remaining,
    q.remaining_count
  );
  if (remaining === null && limit !== null && used !== null) {
    remaining = Math.max(0, limit - used);
  }

  const creditsRemaining = pickNumber(
    merged.credits_remaining,
    merged.creditsRemaining,
    q.credits_remaining,
    q.creditsRemaining
  );
  const creditsExpireAt = pickString(
    merged.credits_expire_at as string | undefined,
    merged.creditsExpireAt as string | undefined,
    merged.expire_at as string | undefined,
    q.expire_at as string | undefined
  );
  let creditsDaysLeft: number | null = null;
  if (creditsExpireAt) {
    creditsDaysLeft = Math.max(
      0,
      Math.ceil((new Date(creditsExpireAt).getTime() - Date.now()) / 86400000)
    );
  } else {
    creditsDaysLeft = pickNumber(merged.credits_days_left, merged.creditsDaysLeft, q.credits_days_left);
  }

  const bmRaw = pickString(
    merged.billing_model as string | undefined,
    merged.billingModel as string | undefined,
    q.billing_model as string | undefined
  );
  let billingModel: string = "free";
  if (bmRaw === "credits" || bmRaw === "legacy_pro" || bmRaw === "free") {
    billingModel = bmRaw;
  } else if (typeof creditsRemaining === "number" && creditsRemaining > 0) {
    billingModel = "credits";
  }

  const plan =
    pickString(merged.plan as string | undefined, q.plan as string | undefined) ??
    (billingModel === "credits" ? "pro" : "free");

  return {
    authenticated: hasBearer,
    plan,
    used: used ?? 0,
    limit: limit ?? 0,
    remaining: remaining ?? 0,
    creditsRemaining: creditsRemaining ?? 0,
    creditsExpireAt: creditsExpireAt ?? null,
    creditsDaysLeft,
    billingModel
  };
}

/**
 * TEMP transitional: cookie-based usage when the browser has no Supabase access token to call shared-core.
 * Do not use as automatic fallback when Bearer exists but shared-core fails.
 */
async function fetchTransitionalUsageStatusFromNextRoute(): Promise<Record<string, unknown>> {
  const r = await fetch("/api/usage-status", { credentials: "include" });
  const d = (await r.json().catch(() => ({}))) as Record<string, unknown>;
  return d;
}

function degradedUsagePayloadWhenCoreUnavailable(): Record<string, unknown> {
  return mapSharedCoreUsageQuotaToUsageStatusPayload(null, null, true);
}

/**
 * Primary: shared-core /v1/usage + /v1/quota when Bearer present.
 * No Bearer: transitional GET /api/usage-status (anonymous cookie path).
 * Bearer but core errors: explicit degraded payload (no silent legacy fetch).
 */
export async function fetchUsageStatusPayloadPrimary(accessToken: string | null): Promise<Record<string, unknown>> {
  const token = typeof accessToken === "string" && accessToken.trim().length > 0 ? accessToken.trim() : null;
  if (!token) {
    return fetchTransitionalUsageStatusFromNextRoute();
  }

  try {
    const [usageRes, quotaRes] = await Promise.all([
      apiClient.getUsage(token),
      apiClient.getQuota(token)
    ]);

    const usageJson = usageRes.ok ? await usageRes.json().catch(() => null) : null;
    const quotaJson = quotaRes.ok ? await quotaRes.json().catch(() => null) : null;

    if (!usageRes.ok && !quotaRes.ok) {
      return degradedUsagePayloadWhenCoreUnavailable();
    }

    return mapSharedCoreUsageQuotaToUsageStatusPayload(usageJson, quotaJson, true);
  } catch {
    return degradedUsagePayloadWhenCoreUnavailable();
  }
}

export async function fetchUsageQuotaToolUi(accessToken: string | null): Promise<UsageStatusUiSlice> {
  const d = await fetchUsageStatusPayloadPrimary(accessToken);
  return parseUsageStatusForToolUi(d);
}
