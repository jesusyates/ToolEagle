import { cookies } from "next/headers";
import { COOKIE_PREFERRED_LOCALE } from "@/config/market";

/**
 * 未登录重定向到登录页：若用户偏好中文（cookie 或 next 为 /zh*），走 `/zh/login`。
 */
export function buildLoginRedirect(next: string): string {
  const locale = cookies().get(COOKIE_PREFERRED_LOCALE)?.value;
  const useZh = locale === "zh" || next.startsWith("/zh");
  const base = useZh ? "/zh/login" : "/login";
  const defaultNext = useZh ? "/zh" : "/dashboard";
  if (next === defaultNext) return base;
  return `${base}?next=${encodeURIComponent(next)}`;
}
