import { tools } from "@/config/tools";

/**
 * 中文工作台仪表盘仅展示抖音专栏（`douyin-*`）工具，与英文站历史隔离。
 * 后续若增加其他国家站：为各市场增加独立 `*-dashboard-scope`（或共享 `market` + slug 前缀表），
 * 在对应 `/{locale}/dashboard` 服务端过滤；勿在单一仪表盘混排多市场 slug。
 */
const DOUYIN_SLUGS = new Set(
  tools.filter((t) => t.slug.startsWith("douyin-")).map((t) => t.slug)
);

export function isZhDashboardDouyinSlug(slug: string): boolean {
  return DOUYIN_SLUGS.has(slug);
}

/** 「再次使用」等链接：抖音工具走 `/zh/douyin-*`。 */
export function zhDashboardToolHref(slug: string): string {
  if (isZhDashboardDouyinSlug(slug)) return `/zh/${slug}`;
  return "/zh/douyin";
}

export function zhDashboardToolDisplayName(slug: string, storedName: string): string {
  const t = tools.find((x) => x.slug === slug);
  return t?.nameZh ?? t?.name ?? storedName;
}
