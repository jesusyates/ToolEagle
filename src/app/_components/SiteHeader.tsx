"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { AuthButton } from "@/components/auth/AuthButton";
import { MarketSelector } from "@/components/locale/MarketSelector";
import { ToolEagleLogoMark } from "@/components/brand/ToolEagleLogoMark";
import { englishSwitchHref } from "@/lib/market/locale-switch-href";

/** 英文首页：须带 `?te_locale=en`，否则 middleware 可能按 zh cookie/geo 把 `/` 重定向到 `/zh`。 */
const EN_HOME = englishSwitchHref("/");

/** V109.4 / V109.6 — Home + core nav; Pro CTA removed (use /pricing). */
const primaryNav = [
  { href: EN_HOME, key: "home" as const },
  { href: "/tools", key: "tools" as const },
  { href: "/creator", key: "creatorHub" as const },
  { href: "/en/how-to", key: "guides" as const },
  { href: "/pricing", key: "pricing" as const }
];

function isPrimaryNavActive(pathname: string, key: (typeof primaryNav)[number]["key"]): boolean {
  const p = pathname || "/";
  if (key === "home") return p === "/" || p === "";
  if (key === "tools") return p === "/tools" || p.startsWith("/tools/");
  if (key === "creatorHub") return p === "/creator" || p.startsWith("/creator/");
  if (key === "guides") return p.startsWith("/en/how-to");
  if (key === "pricing") return p === "/pricing" || p.startsWith("/pricing/");
  return false;
}

export function SiteHeader() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-page/90 backdrop-blur">
      <div className="container py-3.5 sm:py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <Link
          href={EN_HOME}
          prefetch
          className="flex items-center gap-2.5 shrink-0 rounded-lg outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500/50"
          aria-label={t("homeLogoAria")}
        >
          <ToolEagleLogoMark variant="global" />
          <div>
            <p className="text-lg font-semibold tracking-tight text-slate-900" translate="no">
              ToolEagle
            </p>
            <p className="text-xs text-slate-600">{t("slogan")}</p>
          </div>
        </Link>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-x-2 gap-y-2 min-w-0 sm:min-w-[min(100%,42rem)]">
          <nav
            className="flex flex-wrap items-center gap-0.5 sm:gap-1 text-xs sm:text-sm text-slate-700"
            aria-label="Primary"
          >
            {primaryNav.map((item) => {
              const active = isPrimaryNavActive(pathname, item.key);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  prefetch
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "px-2 sm:px-3 py-1.5 sm:py-2 rounded-full whitespace-nowrap font-semibold text-sky-800 bg-sky-100 ring-1 ring-sky-200/80 shadow-sm"
                      : "px-2 sm:px-3 py-1.5 sm:py-2 rounded-full text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition duration-150 whitespace-nowrap"
                  }
                >
                  {t(item.key)}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <MarketSelector analyticsSource="en_header" presentation="dropdown" />
            <AuthButton loginAnalyticsSource="en_header" loginNextPath="/dashboard" billingHref="/dashboard/billing" />
          </div>
        </div>
      </div>
    </header>
  );
}

