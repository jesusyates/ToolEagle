/**
 * V100.1 — Gate experimental surfaces for core supporters (flag-based early access).
 */

import type { SupporterPerks } from "@/lib/supporter/supporter-perks";

export function hasSupporterEarlyFeatureAccess(perks: SupporterPerks | null | undefined): boolean {
  return Boolean(perks?.earlyFeatureAccess);
}
