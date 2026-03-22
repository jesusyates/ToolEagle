/**
 * Usage limits and tracking for monetization (V94).
 * Free (signed-in + anonymous cookie): N AI calls/day via /api/generate & /api/improve.
 * Pro: unlimited (profiles.plan === 'pro').
 */

export const FREE_DAILY_LIMIT = 5;

export type Plan = "free" | "pro";
