/** V97.1 — Non-production (or flagged prod) geo redirect testing */
export const GEO_DEBUG_COOKIE = "te_geo_debug";

export function geoDebugEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ENABLE_GEO_DEBUG === "1";
}
