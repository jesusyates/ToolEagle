export type CreditsSummary = { remaining: number; total: number };

function num(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) return Number(v);
  return undefined;
}

/** Map GET /v1/account/entitlements JSON to header/billing credit summary (best-effort). */
export function mapEntitlementsToCreditsSummary(json: unknown): CreditsSummary | null {
  if (!json || typeof json !== "object") return null;
  const root = json as Record<string, unknown>;
  const data = root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : root;

  let remaining =
    num(data.remaining_credits) ??
    num(data.remainingCredits) ??
    num(data.credits_remaining) ??
    (data.credits && typeof data.credits === "object"
      ? num((data.credits as Record<string, unknown>).remaining) ??
        num((data.credits as Record<string, unknown>).balance)
      : undefined);

  let total =
    num(data.total_credits) ??
    num(data.totalCredits) ??
    (data.credits && typeof data.credits === "object"
      ? num((data.credits as Record<string, unknown>).total)
      : undefined);

  if (remaining == null && total == null) return null;
  if (remaining == null) remaining = 0;
  if (total == null) total = remaining;
  return { remaining, total };
}

export function mapEntitlementsToExpireAt(json: unknown): string | null {
  if (!json || typeof json !== "object") return null;
  const root = json as Record<string, unknown>;
  const data = root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : root;
  const raw =
    data.expire_at ??
    data.expireAt ??
    data.credits_expire_at ??
    (data.credits && typeof data.credits === "object"
      ? (data.credits as Record<string, unknown>).expire_at
      : undefined);
  return typeof raw === "string" ? raw : null;
}
