/**
 * V97: Market / locale cookies — extensible for CN, JP, ES, DE, …
 */

export const COOKIE_PREFERRED_LOCALE = "te_preferred_locale";
export const COOKIE_PREFERRED_MARKET = "te_preferred_market";

export type PreferredLocale = "en" | "zh";
export type PreferredMarket = "global" | "cn" | "jp" | "es" | "de";

export const MARKET_COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production"
};

/** Future: map market → default locale path prefix */
export function localePathForMarket(market: PreferredMarket): string {
  switch (market) {
    case "cn":
      return "/zh";
    case "jp":
      return "/jp"; // future
    case "es":
      return "/es";
    case "de":
      return "/de";
    default:
      return "";
  }
}
