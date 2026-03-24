"use client";

import { COOKIE_PREFERRED_LOCALE, COOKIE_PREFERRED_MARKET, MARKET_COOKIE_OPTIONS } from "@/config/market";

/**
 * 写入「英文主站 / 全球市场」偏好，供 `middleware` 中 `resolveRootHomePath` 识别，
 * 避免华语区访客访问 `/` 时被重定向回 `/zh`。
 */
export function setPreferredEnglishGlobalCookies() {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? ";Secure" : "";
  const maxAge = MARKET_COOKIE_OPTIONS.maxAge;
  document.cookie = `${COOKIE_PREFERRED_LOCALE}=en;path=/;max-age=${maxAge};SameSite=Lax${secure}`;
  document.cookie = `${COOKIE_PREFERRED_MARKET}=global;path=/;max-age=${maxAge};SameSite=Lax${secure}`;
}

/**
 * 进入英文首页：走 `/?te_locale=en`，由 middleware 发 Set-Cookie（en/global），再 302 到 `/`。
 * 仅靠客户端写 cookie 时，若仍带着旧的 `te_preferred_locale=zh`，会被 resolveRootHomePath 打回 `/zh`。
 */
export function navigateToEnglishHome() {
  if (typeof window === "undefined") return;
  setPreferredEnglishGlobalCookies();
  const url = new URL("/", window.location.origin);
  url.searchParams.set("te_locale", "en");
  window.location.assign(url.toString());
}
