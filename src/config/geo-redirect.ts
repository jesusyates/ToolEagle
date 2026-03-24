import type { NextRequest } from "next/server";
import { getCountryFromHeaders } from "@/lib/country";
import { matchLocale } from "@/config/i18n";
import { COOKIE_PREFERRED_LOCALE } from "@/config/market";
import { GEO_DEBUG_COOKIE, geoDebugEnabled } from "@/config/geo-debug";

/** Regions where the product’s Chinese site (`/zh`) is the default locale home. */
const ZH_SPEAKING_REGIONS = new Set(["CN", "TW", "HK", "MO"]);

/**
 * Non-production (or ENABLE_GEO_DEBUG=1) — force cn vs global for testing.
 */
export function readGeoDebug(request: NextRequest): "cn" | "global" | null {
  if (!geoDebugEnabled()) return null;
  const q = request.nextUrl.searchParams.get("geo_debug");
  if (q === "cn") return "cn";
  if (q === "global" || q === "en") return "global";
  const c = request.cookies.get(GEO_DEBUG_COOKIE)?.value;
  if (c === "cn") return "cn";
  if (c === "global") return "global";
  return null;
}

/**
 * Infer locale/market from IP + Accept-Language only (no preferred-locale cookie).
 * Used to set cookies on first visit to `/` when staying on global English.
 */
export function inferLocaleMarketFromGeo(request: NextRequest): {
  locale: "en" | "zh";
  market: "global" | "cn";
} {
  const geoDebug = readGeoDebug(request);
  if (geoDebug === "cn") return { locale: "zh", market: "cn" };
  if (geoDebug === "global") return { locale: "en", market: "global" };

  const geo = getCountryFromHeaders(request.headers);
  const al = request.headers.get("accept-language");
  const zhFromLang = matchLocale(al) === "zh";
  const fromChina = geo === "CN";
  const noGeo = geo == null || geo === "";
  const fromZhSpeakingRegion = geo != null && ZH_SPEAKING_REGIONS.has(geo);

  if (fromChina || fromZhSpeakingRegion || (noGeo && zhFromLang)) {
    return { locale: "zh", market: "cn" };
  }
  return { locale: "en", market: "global" };
}

/**
 * Where a visitor to `/` should land: global English (`/`) or Chinese site (`/zh`).
 * - Honors `geo_debug` and `te_preferred_locale` (manual choice via MarketLocaleSwitcher).
 * - First visit (no locale cookie): IP + Accept-Language.
 * Other ISO countries without a dedicated locale home (e.g. `/es` index) stay on `/`;
 * extend mapping when new country homes ship.
 */
export function resolveRootHomePath(request: NextRequest): "/" | "/zh" {
  /** 用户显式偏好优先于 geo_debug / IP（否则「选英文」仍会被 te_geo_debug=cn 打回 /zh） */
  const localeCookie = request.cookies.get(COOKIE_PREFERRED_LOCALE)?.value;
  if (localeCookie === "zh") return "/zh";
  if (localeCookie === "en") return "/";

  const geoDebug = readGeoDebug(request);
  if (geoDebug === "cn") return "/zh";
  if (geoDebug === "global") return "/";

  const { locale } = inferLocaleMarketFromGeo(request);
  return locale === "zh" ? "/zh" : "/";
}
