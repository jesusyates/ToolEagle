"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  COOKIE_PREFERRED_LOCALE,
  COOKIE_PREFERRED_MARKET,
  MARKET_COOKIE_OPTIONS
} from "@/config/market";
import { enPathToZh } from "@/lib/zh-site/paths";
import { navigateToEnglishHome } from "@/lib/market/navigate-to-english-home";

function setBrowserCookie(name: string, value: string) {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? ";Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${MARKET_COOKIE_OPTIONS.maxAge};SameSite=Lax${secure}`;
}

/**
 * V97: EN / 中文 — sets preferred_locale + preferred_market then full navigation.
 * Future: extend for /jp, /es (see docs/V97-GEO-LOCALIZATION.md).
 */
export function MarketLocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname() || "";
  const isZh = pathname.startsWith("/zh");

  function goEnglish() {
    setBrowserCookie(COOKIE_PREFERRED_LOCALE, "en");
    setBrowserCookie(COOKIE_PREFERRED_MARKET, "global");
    if (pathname.startsWith("/zh")) {
      router.push("/");
    } else {
      router.push(pathname || "/");
    }
  }

  function goChinese() {
    setBrowserCookie(COOKIE_PREFERRED_LOCALE, "zh");
    setBrowserCookie(COOKIE_PREFERRED_MARKET, "cn");
    if (pathname.startsWith("/zh")) {
      router.push(pathname);
      return;
    }
    router.push(enPathToZh(pathname === "/" ? "/" : pathname));
  }

  return (
    <div className="flex items-center gap-1 text-xs text-slate-600 shrink-0">
      <button
        type="button"
        onClick={goEnglish}
        className={`px-2 py-1 rounded ${!isZh ? "font-semibold text-sky-600 bg-sky-50" : "hover:text-sky-600"}`}
      >
        EN
      </button>
      <span className="text-slate-300">|</span>
      <button
        type="button"
        onClick={goChinese}
        className={`px-2 py-1 rounded ${isZh ? "font-semibold text-sky-600 bg-sky-50" : "hover:text-sky-600"}`}
      >
        中文
      </button>
    </div>
  );
}
