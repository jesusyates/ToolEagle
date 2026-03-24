import { getCreditPackage, listCreditPackages } from "@/lib/billing/package-config";

export const CN_CREDIT_PACK_IDS = ["cn_trial", "cn_standard", "cn_advanced", "cn_pro"] as const;
export type CnCreditPackId = (typeof CN_CREDIT_PACK_IDS)[number];

export type CnCreditPackDef = {
  id: CnCreditPackId;
  labelZh: string;
  cny: number;
  credits: number;
  days: number;
};

export function getCreditPack(plan: string): { credits: number; days: number; cny: number } | null {
  const p = getCreditPackage("cn", plan);
  if (!p) return null;
  return { credits: p.credits_total, days: p.validity_days, cny: p.amount };
}

export function listCreditPacksForUi(): CnCreditPackDef[] {
  return listCreditPackages("cn").map((p) => ({
    id: p.package_id as CnCreditPackId,
    labelZh: p.display_name,
    cny: p.amount,
    credits: p.credits_total,
    days: p.validity_days
  }));
}
