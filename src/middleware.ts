import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { getCountryFromHeaders, getCountryFromPathname } from "@/lib/country";
import {
  COOKIE_PREFERRED_LOCALE,
  COOKIE_PREFERRED_MARKET,
  MARKET_COOKIE_OPTIONS
} from "@/config/market";
import { GEO_DEBUG_COOKIE, geoDebugEnabled } from "@/config/geo-debug";
import { inferLocaleMarketFromGeo, resolveRootHomePath } from "@/config/geo-redirect";

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((c) => {
    to.cookies.set(c.name, c.value);
  });
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const requestHeaders = new Headers(request.headers);
  if (!requestHeaders.has("x-pathname")) {
    requestHeaders.set("x-pathname", pathname);
  }
  if (!requestHeaders.has("x-country")) {
    const fromHeader = getCountryFromHeaders(request.headers);
    const country = fromHeader ?? getCountryFromPathname(pathname);
    requestHeaders.set("x-country", country);
  }

  const req = new NextRequest(request.url, { headers: requestHeaders });
  const response = await updateSession(req);

  if (request.method === "GET" && geoDebugEnabled()) {
    const dbg = request.nextUrl.searchParams.get("geo_debug");
    if (dbg === "cn" || dbg === "global" || dbg === "en") {
      response.cookies.set(GEO_DEBUG_COOKIE, dbg === "cn" ? "cn" : "global", {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "lax"
      });
    }
  }

  const hasMarketCookie =
    request.cookies.get(COOKIE_PREFERRED_LOCALE)?.value ||
    request.cookies.get(COOKIE_PREFERRED_MARKET)?.value;

  /**
   * 顶栏语言切换（纯 `<a href>`，不依赖客户端写 cookie）：
   * - `?te_locale=en` → en / global（覆盖旧 zh 偏好）
   * - `?te_locale=zh` → zh / cn（覆盖旧 en 偏好，否则「中文」链过去仍带 en cookie）
   * 服务端 Set-Cookie 后 302 到去掉 query 的同一 pathname。
   */
  if (request.method === "GET") {
    const teLocale = request.nextUrl.searchParams.get("te_locale");
    if (teLocale === "en" || teLocale === "zh") {
      const clean = request.nextUrl.clone();
      clean.searchParams.delete("te_locale");
      const redirect = NextResponse.redirect(clean);
      copyCookies(response, redirect);
      if (teLocale === "en") {
        redirect.cookies.set(COOKIE_PREFERRED_LOCALE, "en", MARKET_COOKIE_OPTIONS);
        redirect.cookies.set(COOKIE_PREFERRED_MARKET, "global", MARKET_COOKIE_OPTIONS);
      } else {
        redirect.cookies.set(COOKIE_PREFERRED_LOCALE, "zh", MARKET_COOKIE_OPTIONS);
        redirect.cookies.set(COOKIE_PREFERRED_MARKET, "cn", MARKET_COOKIE_OPTIONS);
      }
      return redirect;
    }
  }

  if (pathname === "/" && request.method === "GET") {
    const target = resolveRootHomePath(request);

    if (target === "/zh") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/zh";
      const redirect = NextResponse.redirect(redirectUrl);
      copyCookies(response, redirect);
      redirect.cookies.set(COOKIE_PREFERRED_LOCALE, "zh", MARKET_COOKIE_OPTIONS);
      redirect.cookies.set(COOKIE_PREFERRED_MARKET, "cn", MARKET_COOKIE_OPTIONS);
      const dbg = request.nextUrl.searchParams.get("geo_debug");
      if (geoDebugEnabled() && (dbg === "cn" || dbg === "global" || dbg === "en")) {
        redirect.cookies.set(GEO_DEBUG_COOKIE, dbg === "cn" ? "cn" : "global", {
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
          sameSite: "lax"
        });
      }
      return redirect;
    }

    if (!hasMarketCookie) {
      const { locale, market } = inferLocaleMarketFromGeo(request);
      response.cookies.set(COOKIE_PREFERRED_LOCALE, locale, MARKET_COOKIE_OPTIONS);
      response.cookies.set(COOKIE_PREFERRED_MARKET, market, MARKET_COOKIE_OPTIONS);
      const dbg = request.nextUrl.searchParams.get("geo_debug");
      if (geoDebugEnabled() && (dbg === "cn" || dbg === "global" || dbg === "en")) {
        response.cookies.set(GEO_DEBUG_COOKIE, dbg === "cn" ? "cn" : "global", {
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
          sameSite: "lax"
        });
      }
    }

    return response;
  }

  if (
    pathname.startsWith("/zh") &&
    request.method === "GET" &&
    !request.cookies.get(COOKIE_PREFERRED_LOCALE)?.value
  ) {
    response.cookies.set(COOKIE_PREFERRED_LOCALE, "zh", MARKET_COOKIE_OPTIONS);
    response.cookies.set(COOKIE_PREFERRED_MARKET, "cn", MARKET_COOKIE_OPTIONS);
  }

  return response;
}

export const config = {
  /** 显式包含 `/`，避免部分环境下根路径未进入 middleware（如部分 HEAD / 边缘探测） */
  matcher: [
    "/",
    "/((?!api/sitemap|sitemap|robots\\.txt|_next|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};
