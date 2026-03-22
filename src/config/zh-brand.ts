/**
 * 中文站统一品牌表达（Hero / 定价 / Pro / CTA）
 */
export const ZH_BRAND_TAGLINE = "让内容，直接为你带来结果";

/** 副标题 — 两行换行展示（定价/Pro/各 Hero 共用） */
export const ZH_BRAND_SUBLINE = `按平台、按场景，
生成真正能发布、能吸引、能转化的内容`;

/** 全站 metadata / 浏览器标题后缀（禁止再写「ToolEagle 中文站」） */
export const ZH_PAGE_TITLE_SUFFIX = "| ToolEagle";

/** `/zh` 静态页与工具页 metadata：主文案 + 品牌 slogan + 后缀（与定价/Pro 一致） */
export function zhSeoTitle(lead: string): string {
  return `${lead} · ${ZH_BRAND_TAGLINE} | ToolEagle`;
}
