/**
 * V76.5: Country detection helpers (soft detection only).
 * No UI. Foundation for future multi-country expansion.
 */

import type { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";
import { defaultCountry } from "@/config/countries";
import type { CountryCode } from "@/config/countries";

/** Cloudflare sets cf-ipcountry, Vercel sets x-vercel-ip-country */
const COUNTRY_HEADERS = ["cf-ipcountry", "x-vercel-ip-country"] as const;

/**
 * Get country from request headers (Cloudflare/Vercel).
 * Returns 2-letter ISO code or null if not present.
 */
export function getCountryFromHeaders(headers: Headers | ReadonlyHeaders): string | null {
  for (const key of COUNTRY_HEADERS) {
    const value = headers.get(key);
    if (value && value.length === 2) {
      return value.toUpperCase();
    }
  }
  return null;
}

/**
 * Infer country from pathname.
 * /zh/* → CN, else → US (default for non-zh).
 */
export function getCountryFromPathname(pathname: string): CountryCode {
  if (pathname.startsWith("/zh")) return "CN";
  return "US";
}

export type ResolveCountryOptions = {
  headers?: Headers | ReadonlyHeaders;
  pathname?: string;
  /** Future: override from query or cookie. Placeholder. */
  override?: CountryCode | null;
};

/**
 * Resolve country with priority:
 * 1. override (future: query/cookie)
 * 2. header (cf-ipcountry, x-vercel-ip-country)
 * 3. pathname fallback (/zh → CN, else US)
 */
export function resolveCountry(options: ResolveCountryOptions): CountryCode {
  if (options.override) return options.override;

  if (options.headers) {
    const fromHeader = getCountryFromHeaders(options.headers);
    if (fromHeader) return fromHeader;
  }

  if (options.pathname) {
    return getCountryFromPathname(options.pathname);
  }

  return defaultCountry;
}

// TODO V76.5: Country selector UI
// TODO V76.5: Country-specific homepage banners
// TODO V76.5: Country-based tool ranking
// TODO V76.5: Country-based pricing
