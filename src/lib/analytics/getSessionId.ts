/**
 * V104.3 — Session linkage for conversion funnel analytics.
 *
 * Client-only: stored in sessionStorage so it persists across navigations in the same browser tab/session.
 */

export const SESSION_ID_KEY = "te_session_id_v1";

export function getOrCreateSessionId(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const existing = sessionStorage.getItem(SESSION_ID_KEY);
    if (existing && existing.trim().length > 8) return existing;

    const v =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `sid_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    sessionStorage.setItem(SESSION_ID_KEY, v);
    return v;
  } catch {
    return null;
  }
}

