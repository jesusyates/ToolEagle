export const PROTECTION_CONFIG = {
  rateLimit: {
    loggedIn: { sec1Max: 1, sec10Max: 5, sec60Max: 20 },
    anonymous: { sec60Max: 5 }
  },
  dailyCreditsLimit: {
    anonymous: 30,
    freeLoggedIn: 100
  },
  banSeconds: 30 * 60,
  risk: {
    midThreshold: 30,
    highThreshold: 60,
    banThreshold: 80,
    midDelayMinMs: 1000,
    midDelayMaxMs: 3000
  },
  globalCostGuard: {
    dailyCreditsLimit: Number(process.env.RISK_GLOBAL_DAILY_CREDITS_LIMIT ?? "100000")
  }
} as const;

