/**
 * 中文站「工具栈首页」判定：悬浮打赏仅在此类页面展示（如抖音 `/zh/douyin`、工具索引 `/zh/douyin/tools`），
 * 不在各独立生成器 / 长文 SEO 页展示。
 */
export function isZhToolHubPagePath(pathname: string): boolean {
  const p = pathname.replace(/\/$/, "") || "/";
  if (!p.startsWith("/zh")) return false;
  if (p === "/zh/douyin") return true;
  if (p === "/zh/douyin/tools" || p.startsWith("/zh/douyin/tools/")) return true;
  return false;
}
