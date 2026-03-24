"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { BookOpen, LayoutGrid, Sparkles } from "lucide-react";

/** V109.7 — Light portal rails: Tools / Guides / Pricing (not a tool directory) */
export function HomeStartHereSection() {
  const t = useTranslations("home");

  const cards = [
    {
      href: "/tools",
      titleKey: "startHereToolsTitle" as const,
      descKey: "startHereToolsDesc" as const,
      ctaKey: "startHereToolsCta" as const,
      icon: LayoutGrid
    },
    {
      href: "/en/how-to",
      titleKey: "startHereGuidesTitle" as const,
      descKey: "startHereGuidesDesc" as const,
      ctaKey: "startHereGuidesCta" as const,
      icon: BookOpen
    },
    {
      href: "/pricing",
      titleKey: "startHerePricingTitle" as const,
      descKey: "startHerePricingDesc" as const,
      ctaKey: "startHerePricingCta" as const,
      icon: Sparkles
    }
  ];

  return (
    <section className="container py-10 sm:py-12" aria-labelledby="home-start-here-heading">
      <h2 id="home-start-here-heading" className="text-xl sm:text-2xl font-semibold text-slate-900">
        {t("startHereHeading")}
      </h2>
      <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-relaxed">{t("startHereIntro")}</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-3">
        {cards.map(({ href, titleKey, descKey, ctaKey, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-200 hover:shadow-md"
            >
              <Icon className="h-6 w-6 text-sky-600" aria-hidden />
              <span className="mt-3 text-base font-semibold text-slate-900">{t(titleKey)}</span>
              <span className="mt-1 flex-1 text-sm text-slate-600 leading-snug">{t(descKey)}</span>
              <span className="mt-4 text-sm font-semibold text-sky-700">{t(ctaKey)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
