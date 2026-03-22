/**
 * V100.2 — Client-only id for support funnel analytics (not the httpOnly server cookie).
 */

const KEY = "te_support_client_analytics_id";

export function getSupportClientAnalyticsId(): string {
  if (typeof window === "undefined") return "";
  try {
    let v = localStorage.getItem(KEY);
    if (!v || v.length < 8) {
      v = `c_${crypto.randomUUID?.() ?? String(Date.now())}`;
      localStorage.setItem(KEY, v);
    }
    return v;
  } catch {
    return "";
  }
}
