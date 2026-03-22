"use client";

import type { ChangeEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  COOKIE_PREFERRED_LOCALE,
  COOKIE_PREFERRED_MARKET,
  MARKET_COOKIE_OPTIONS
} from "@/config/market";
import type { PreferredMarket } from "@/config/market";
import { enPathToZh } from "@/lib/zh-site/paths";
import { trackEvent } from "@/lib/analytics";

function setBrowserCookie(name: string, value: string) {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? ";Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${MARKET_COOKIE_OPTIONS.maxAge};SameSite=Lax${secure}`;
}

type Props = {
  /** 埋点来源，如 zh_header、en_header */
  analyticsSource?: string;
  /**
   * 英文主站：下拉含英文 / 中文 / 西语（便于从全球站进中文站）。
   * 中文站：仅「全球网站」按钮（不再显示「中文」分段，避免重复）。
   */
  presentation?: "segmented" | "dropdown";
};

type UiMarket = "en" | "zh" | "es";

function detectUiMarket(pathname: string): UiMarket {
  if (pathname.startsWith("/zh")) return "zh";
  if (pathname.startsWith("/es")) return "es";
  return "en";
}

/**
 * 国家/语言切换：仅客户端导航 + cookie，**不**改各 URL 的 metadata / canonical / sitemap（爬虫按页面自身 SEO 规则收录）。
 */
export function MarketSelector({ analyticsSource = "header", presentation = "segmented" }: Props) {
  const router = useRouter();
  const pathname = usePathname() || "";
  const isZh = pathname.startsWith("/zh");
  const uiMarket = detectUiMarket(pathname);

  function navigate(href: string) {
    router.push(href);
  }

  function emitSwitch(to: UiMarket) {
    const from =
      pathname.startsWith("/zh") ? "zh" : pathname.startsWith("/es") ? "es" : "en";
    trackEvent("market_switch", {
      from_locale: from,
      to_market: to,
      pathname: pathname.slice(0, 200),
      source: analyticsSource
    });
  }

  function goEnglish() {
    emitSwitch("en");
    setBrowserCookie(COOKIE_PREFERRED_LOCALE, "en");
    setBrowserCookie(COOKIE_PREFERRED_MARKET, "global");
    if (pathname.startsWith("/zh")) {
      navigate("/");
      return;
    }
    if (pathname.startsWith("/es")) {
      navigate("/");
      return;
    }
    navigate(pathname || "/");
  }

  function goChinese() {
    emitSwitch("zh");
    setBrowserCookie(COOKIE_PREFERRED_LOCALE, "zh");
    setBrowserCookie(COOKIE_PREFERRED_MARKET, "cn");
    if (pathname.startsWith("/zh")) {
      navigate(pathname);
      return;
    }
    if (pathname.startsWith("/es")) {
      navigate("/zh");
      return;
    }
    navigate(enPathToZh(pathname === "/" ? "/" : pathname));
  }

  function goSpanish() {
    emitSwitch("es");
    setBrowserCookie(COOKIE_PREFERRED_LOCALE, "en");
    setBrowserCookie(COOKIE_PREFERRED_MARKET, "es" as PreferredMarket);
    if (pathname.startsWith("/es")) {
      navigate(pathname);
      return;
    }
    navigate("/es/how-to");
  }

  function onDropdownChange(e: ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value as UiMarket;
    if (v === "en") goEnglish();
    else if (v === "zh") goChinese();
    else if (v === "es") goSpanish();
  }

  if (presentation === "dropdown") {
    return (
      <div
        className="flex items-center gap-2 text-xs text-slate-600 shrink-0"
        aria-label="选择国家或语言 / Select region or language"
      >
        <span className="hidden sm:inline text-slate-500 whitespace-nowrap">选择国家</span>
        <select
          value={uiMarket}
          onChange={onDropdownChange}
          className="max-w-[min(100vw-6rem,220px)] rounded-lg border border-slate-200 bg-page px-2.5 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40"
          aria-label="选择国家或语言"
        >
          <option value="en">English（全球网站）</option>
          <option value="zh">简体中文（中国）</option>
          <option value="es">Español</option>
        </select>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-xs text-slate-600 shrink-0" aria-label="站点语言与区域">
      <button
        type="button"
        onClick={goEnglish}
        className={`px-2 py-1 rounded ${!isZh ? "font-semibold text-sky-600 bg-sky-50" : "hover:text-sky-600"}`}
      >
        全球网站
      </button>
    </div>
  );
}
