/**
 * CN credit packs — amounts, validity, CNY price (aggregator).
 */

export const CN_CREDIT_PACK_IDS = [
  "credits_starter",
  "credits_standard",
  "credits_advanced",
  "credits_pro"
] as const;

export type CnCreditPackId = (typeof CN_CREDIT_PACK_IDS)[number];

export type CnCreditPackDef = {
  id: CnCreditPackId;
  labelZh: string;
  cny: number;
  credits: number;
  days: number;
};

export const CN_CREDIT_PACKS: Record<CnCreditPackId, Omit<CnCreditPackDef, "id">> = {
  credits_starter: { labelZh: "入门", cny: 9, credits: 100, days: 30 },
  credits_standard: { labelZh: "标准（主推）", cny: 29, credits: 500, days: 30 },
  credits_advanced: { labelZh: "进阶", cny: 59, credits: 1200, days: 60 },
  credits_pro: { labelZh: "专业", cny: 99, credits: 2500, days: 90 }
};

export function getCreditPack(plan: string): { credits: number; days: number; cny: number } | null {
  if (!(plan in CN_CREDIT_PACKS)) return null;
  const id = plan as CnCreditPackId;
  const p = CN_CREDIT_PACKS[id];
  return { credits: p.credits, days: p.days, cny: p.cny };
}

export function listCreditPacksForUi(): CnCreditPackDef[] {
  return CN_CREDIT_PACK_IDS.map((id) => ({
    id,
    ...CN_CREDIT_PACKS[id]
  }));
}
