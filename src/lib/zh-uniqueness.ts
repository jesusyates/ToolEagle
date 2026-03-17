/**
 * V66 Content Uniqueness Layer - random intro, CTA variants
 */

const INTRO_VARIANTS = [
  "很多创作者都在问：",
  "如果你正在寻找答案，这篇文章会给你完整的思路。",
  "下面是我们总结的实战经验，希望能帮到你。"
];

const CTA_VARIANTS = [
  "立即用 AI 生成爆款内容 →",
  "免费获取 100 条内容模板 →",
  "一键提升流量，试试工具 →"
];

/** Deterministic hash from slug for stable per-page variant */
function hashSlug(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getIntroVariant(slug: string): string {
  const idx = hashSlug(slug) % INTRO_VARIANTS.length;
  return INTRO_VARIANTS[idx];
}

export function getCtaVariant(slug: string): string {
  const idx = hashSlug(slug) % CTA_VARIANTS.length;
  return CTA_VARIANTS[idx];
}

export function getFreshnessLabel(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
