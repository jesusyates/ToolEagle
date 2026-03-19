"use client";

import { usePathname } from "next/navigation";
import { getCountryFromPathname } from "@/lib/country";
import type { CountryCode } from "@/config/countries";

/**
 * V76.5: Get current country for analytics.
 * Uses pathname: /zh/* → CN, else US.
 * Future: can be enhanced with server-injected country from headers.
 */
export function useCountry(): CountryCode {
  const pathname = usePathname() ?? "";
  return getCountryFromPathname(pathname);
}
