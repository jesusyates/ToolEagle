/**
 * V65 Conversion CTA variants - high-conversion wording
 */
export const ZH_CTA_VARIANTS = [
  "立即生成爆款内容",
  "一键提升流量",
  "免费获取100条内容"
] as const;

export function getCtaVariant(index: number): string {
  return ZH_CTA_VARIANTS[index % ZH_CTA_VARIANTS.length];
}
