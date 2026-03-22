/**
 * V100.1 — Supporter levels, daily bonus generations, free-tier visibility perks.
 */

import { FREE_DAILY_LIMIT } from "@/lib/usage";
import { aggregateDonationOrdersForSupporterKey } from "@/lib/payment/donation-orders";

export type SupporterLevel = "none" | "early_supporter" | "supporter" | "core_supporter";

export type SupporterPerks = {
  level: SupporterLevel;
  /** Extra free generations per day on top of FREE_DAILY_LIMIT */
  dailyGenerationBonus: number;
  /** Extra full (non-truncated) package slots visible on free tier */
  freeVisibleExtraSlots: number;
  /** Flag-based early access (UI / future gates) */
  earlyFeatureAccess: boolean;
};

const THANK_YOU_DEFAULT = "感谢你的支持 ❤️";

/** Level rules: highest matching tier wins (core > supporter > early). */
export function levelFromStats(count: number, sum: number): SupporterLevel {
  if (count <= 0) return "none";
  if (count >= 5 || sum >= 100) return "core_supporter";
  if (count >= 2 || sum >= 25) return "supporter";
  return "early_supporter";
}

export function perksFromLevel(level: SupporterLevel): Omit<SupporterPerks, "level"> {
  switch (level) {
    case "core_supporter":
      return {
        dailyGenerationBonus: 5,
        freeVisibleExtraSlots: 1,
        earlyFeatureAccess: true
      };
    case "supporter":
      return {
        dailyGenerationBonus: 2,
        freeVisibleExtraSlots: 0,
        earlyFeatureAccess: false
      };
    case "early_supporter":
      return {
        dailyGenerationBonus: 1,
        freeVisibleExtraSlots: 0,
        earlyFeatureAccess: false
      };
    default:
      return {
        dailyGenerationBonus: 0,
        freeVisibleExtraSlots: 0,
        earlyFeatureAccess: false
      };
  }
}

export function perksFromStats(count: number, sum: number): SupporterPerks {
  const level = levelFromStats(count, sum);
  return { level, ...perksFromLevel(level) };
}

export async function getSupporterPerksForUserKey(userKey: string | null): Promise<SupporterPerks> {
  if (!userKey) {
    return { level: "none", ...perksFromLevel("none") };
  }
  const { count, sum } = await aggregateDonationOrdersForSupporterKey(userKey);
  return perksFromStats(count, sum);
}

export function effectiveFreeDailyLimit(perks: SupporterPerks): number {
  return FREE_DAILY_LIMIT + perks.dailyGenerationBonus;
}

export { THANK_YOU_DEFAULT };
