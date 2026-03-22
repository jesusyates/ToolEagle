/**
 * V101.1 — Preset donation amounts (CNY), callback-verified only.
 */

export const DONATION_TIER_AMOUNTS_CNY = [5, 10, 20] as const;

export type DonationTierCny = (typeof DONATION_TIER_AMOUNTS_CNY)[number];

export function isValidDonationAmountCny(n: number): n is DonationTierCny {
  return (DONATION_TIER_AMOUNTS_CNY as readonly number[]).includes(n);
}
