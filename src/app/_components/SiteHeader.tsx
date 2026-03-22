"use client";

import { TranslateAwareLink } from "@/components/TranslateAwareLink";
import { useTranslations } from "next-intl";
import { Bird } from "lucide-react";
import { AuthButton } from "@/components/auth/AuthButton";
import { UpgradeLink } from "@/components/monetization/UpgradeLink";
import { MarketSelector } from "@/components/locale/MarketSelector";

const navPaths = [
  { href: "/", key: "home" as const },
  { href: "/discover", key: "discover" as const },
  { href: "/ai-prompts", key: "aiPrompts" as const },
  { href: "/learn-ai", key: "learnAi" as const },
  { href: "/answers", key: "answers" as const },
  { href: "/creators", key: "creators" as const },
  { href: "/community", key: "community" as const },
  { href: "/favorites", key: "favorites" as const },
  { href: "/me", key: "me" as const },
  { href: "/dashboard", key: "dashboard" as const },
  { href: "/creator", key: "creator" as const },
  { href: "/pricing", key: "pricing" as const },
  { href: "/blog", key: "blog" as const },
  { href: "/about", key: "about" as const }
];

export function SiteHeader() {
  const t = useTranslations("nav");

  return (
    <header className="border-b border-slate-200 bg-page/85 backdrop-blur">
      <div className="container py-4 flex items-center justify-between gap-4">
        <TranslateAwareLink href="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-500 via-cyan-500 to-indigo-500 flex items-center justify-center shadow-sm">
            <Bird className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight text-slate-900" translate="no">
              ToolEagle
            </p>
            <p className="text-xs text-slate-600">{t("slogan")}</p>
          </div>
        </TranslateAwareLink>

        <div className="flex items-center gap-2">
          <MarketSelector analyticsSource="en_header" presentation="dropdown" />
          <nav className="hidden sm:flex items-center gap-2 text-sm text-slate-700">
            {navPaths.map((item) => (
              <TranslateAwareLink
                key={item.href}
                href={item.href}
                className="px-3 py-2 rounded-full hover:bg-sky-50 hover:text-sky-700 hover:underline transition duration-150"
              >
                {t(item.key)}
              </TranslateAwareLink>
            ))}
          </nav>
          <UpgradeLink className="hidden sm:inline-flex items-center rounded-full bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 shrink-0">
            {t("upgrade")}
          </UpgradeLink>
          <AuthButton />
        </div>
      </div>
    </header>
  );
}

