/**
 * V65 Conversion CTA variants - high-conversion wording
 * V85: Tool action labels + high-intent CTA variants
 */

/** Tool CTA labels - stronger action copy */
export const ZH_TOOL_CTA_LABELS = [
  "Start free",
  "Best for beginners",
  "Fastest way",
  "Most creators choose this"
] as const;

/** High-intent page CTA variants (赚钱/变现/引流/make money) - rotate for A/B */
export const ZH_HIGH_INTENT_CTA_VARIANTS = [
  "立即开始变现",
  "试试这个赚钱工具",
  "最快开始的方式"
] as const;

/** One-line benefit under each CTA by slot index */
export const ZH_CTA_BENEFITS: Record<number, string> = {
  0: "免费试用 · 无需注册",
  1: "新手友好 · 上手即用",
  2: "效率提升 · 省时省力"
};

export const ZH_CTA_VARIANTS = [
  "立即生成爆款内容",
  "一键提升流量",
  "免费获取100条内容"
] as const;

export function getCtaVariant(index: number): string {
  return ZH_CTA_VARIANTS[index % ZH_CTA_VARIANTS.length];
}

export function getToolCtaLabel(index: number): string {
  return ZH_TOOL_CTA_LABELS[index % ZH_TOOL_CTA_LABELS.length];
}

export function getHighIntentCtaVariant(index: number): string {
  return ZH_HIGH_INTENT_CTA_VARIANTS[index % ZH_HIGH_INTENT_CTA_VARIANTS.length];
}

/** Deterministic variant index from slug for A/B rotation */
export function getHighIntentCtaIndexForSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = ((h << 5) - h + slug.charCodeAt(i)) | 0;
  return Math.abs(h) % ZH_HIGH_INTENT_CTA_VARIANTS.length;
}

export function getCtaBenefit(index: number): string {
  return ZH_CTA_BENEFITS[index % 3] ?? "限时免费";
}
