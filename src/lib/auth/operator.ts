import type { User } from "@supabase/supabase-js";

/**
 * Ops-only surfaces (e.g. /dashboard/revenue). Uses env allowlists.
 *
 * - If neither `OPERATOR_USER_IDS` nor `OPERATOR_EMAILS` is set: **deny everyone** (all envs).
 * - Local-only escape hatch: set `OPERATOR_DEV_ALLOW_ALL=true` (ignored in production) to treat
 *   any logged-in user as operator for dashboard/API testing.
 */
export function isOperatorUser(user: User | null): boolean {
  if (!user) return false;

  const rawIds = process.env.OPERATOR_USER_IDS?.trim();
  const rawEmails = process.env.OPERATOR_EMAILS?.trim();

  if (!rawIds && !rawEmails) {
    if (process.env.NODE_ENV === "production") return false;
    return process.env.OPERATOR_DEV_ALLOW_ALL === "true";
  }

  const ids = rawIds?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  const emails = rawEmails?.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean) ?? [];

  if (ids.includes(user.id)) return true;
  if (user.email && emails.includes(user.email.toLowerCase())) return true;
  return false;
}
