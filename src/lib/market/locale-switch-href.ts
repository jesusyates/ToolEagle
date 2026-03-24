import { zhPathToEn } from "@/lib/zh-site/paths";

/**
 * 顶栏「切到英文全球站」的 href：`?te_locale=en` 由 middleware 发 Set-Cookie（见 `src/middleware.ts`）。
 * 纯链接即可，不依赖客户端 JS。
 */
export function englishSwitchHref(pathname: string): string {
  const p = (pathname || "/").split("?")[0] || "/";
  if (p.startsWith("/zh")) {
    const target = zhPathToEn(p);
    const join = target.includes("?") ? "&" : "?";
    return `${target}${join}te_locale=en`;
  }
  if (p.startsWith("/es")) {
    return "/?te_locale=en";
  }
  if (p === "/") {
    return "/?te_locale=en";
  }
  return `${p}?te_locale=en`;
}

/**
 * 全球站 → 中文站：顶栏按钮必须 **永远** 落到可解析路由。
 * 曾用 `enPathToZh` 拼 `/zh${enPath}`，易产生 `/zh/en/...`、`/zh/tools` 等无效或重定向链，表现为「点了没反应 / 白屏」。
 * 策略：非 `/zh` 路径一律 `/zh?te_locale=zh`；已在 `/zh` 则仅带 query 让 middleware 写 cookie。
 */
export function chineseSwitchHref(pathname: string): string {
  const p = (pathname || "/").split("?")[0] || "/";
  if (p.startsWith("/zh")) {
    const join = p.includes("?") ? "&" : "?";
    return `${p}${join}te_locale=zh`;
  }
  return `/zh?te_locale=zh`;
}

export function spanishSwitchHref(pathname: string): string {
  const p = (pathname || "/").split("?")[0] || "/";
  if (p.startsWith("/es")) return p;
  return "/es/how-to";
}
