/**
 * Usage limits and tracking for monetization (V94).
 * Enforced on generation via shared-core + server routes; free tier daily cap applies to AI product flows.
 * Paid users: higher limits / credits-based usage.
 */

export const FREE_DAILY_LIMIT = 5;

export type Plan = "free" | "pro";
