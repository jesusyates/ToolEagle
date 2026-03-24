"use client";

import type { MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { TranslateAwareLink } from "@/components/TranslateAwareLink";
import { trackEvent } from "@/lib/analytics";
import { chineseSwitchHref, englishSwitchHref, spanishSwitchHref } from "@/lib/market/locale-switch-href";

type Props = {
  analyticsSource?: string;
  presentation?: "segmented" | "dropdown";
};

type UiMarket = "en" | "zh" | "es";

const MARKET_ORDER: UiMarket[] = ["en", "zh", "es"];

function detectUiMarket(pathname: string): UiMarket {
  if (pathname.startsWith("/zh")) return "zh";
  if (pathname.startsWith("/es")) return "es";
  return "en";
}

function hrefForMarket(pathname: string, market: UiMarket): string {
  if (market === "en") return englishSwitchHref(pathname);
  if (market === "zh") return chineseSwitchHref(pathname);
  return spanishSwitchHref(pathname);
}

function emitSwitch(source: string, pathname: string, to: UiMarket) {
  const from =
    pathname.startsWith("/zh") ? "zh" : pathname.startsWith("/es") ? "es" : "en";
  try {
    trackEvent("market_switch", {
      from_locale: from,
      to_market: to,
      pathname: pathname.slice(0, 200),
      source
    });
  } catch {
    /* ignore */
  }
}

function forceFullNavigation(e: MouseEvent<HTMLAnchorElement>, href: string) {
  if (e.defaultPrevented) return;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (e.button !== 0) return;
  e.preventDefault();
  window.location.assign(new URL(href, window.location.origin).href);
}

function marketOptionLabel(tNav: (k: string) => string, id: UiMarket) {
  if (id === "en") return tNav("marketOptionEn");
  if (id === "zh") return tNav("marketOptionZh");
  return tNav("marketOptionEs");
}

/**
 * 站点切换（英文顶栏）：仅原生 `<select>`，无 Region 标签；说明用 `marketSelectorAria`。
 */
const nativeSelectClass =
  "w-[min(100%,9.5rem)] sm:w-36 min-h-[2.125rem] max-w-[9.5rem] cursor-pointer rounded-lg border border-slate-200 bg-page py-1 pl-1.5 pr-5 text-[11px] font-medium text-slate-800 shadow-sm outline-none transition hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-sky-500/40 sm:text-xs";

export function MarketSelector({ analyticsSource = "header", presentation = "segmented" }: Props) {
  const pathname = usePathname() || "/";
  const isZh = pathname.startsWith("/zh");
  const uiMarket = detectUiMarket(pathname);
  const tNav = useTranslations("nav");
  const enHref = englishSwitchHref(pathname);

  if (presentation === "dropdown") {
    return (
      <div className="shrink-0 text-xs">
        <select
          name="site-market"
          className={nativeSelectClass}
          aria-label={tNav("marketSelectorAria")}
          title={tNav("marketSelectorAria")}
          key={pathname}
          defaultValue={uiMarket}
          onChange={(e) => {
            const next = e.target.value as UiMarket;
            if (next === uiMarket) return;
            emitSwitch(analyticsSource, pathname, next);
            const href = hrefForMarket(pathname, next);
            window.location.replace(new URL(href, window.location.origin).href);
          }}
        >
          {MARKET_ORDER.map((id) => (
            <option key={id} value={id}>
              {marketOptionLabel(tNav, id)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1 text-xs text-slate-600" aria-label="站点语言与区域">
      <TranslateAwareLink
        href={enHref}
        onClick={(e) => {
          emitSwitch(analyticsSource, pathname, "en");
          forceFullNavigation(e, enHref);
        }}
        className={`rounded px-2 py-1 ${!isZh ? "bg-sky-50 font-semibold text-sky-600" : "hover:text-sky-600"}`}
      >
        英文主站
      </TranslateAwareLink>
    </div>
  );
}
