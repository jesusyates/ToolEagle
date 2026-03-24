"use client";

import { useTranslations } from "next-intl";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { HomeHeroGenerate } from "./HomeHeroGenerate";
import { HomeStartHereSection } from "./HomeStartHereSection";
import { HomeExampleOutputs } from "./HomeExampleOutputs";
import { ValueProofBlock } from "@/components/value/ValueProofBlock";

type Props = {
  children?: React.ReactNode;
  /** EN-only guides strip (server component) */
  trendingInjection?: React.ReactNode;
};

/**
 * V109.7 — Global homepage: portal hero → why us → start here → proof → examples → guides discovery.
 * Tool grids and platform directories live on `/tools`, not here.
 */
export function HomePageClient({ children, trendingInjection }: Props) {
  const t = useTranslations("home");
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <HomeHeroGenerate />

        <section className="container py-10 sm:py-12 border-t border-slate-100">
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">{t("whyToolEagle")}</h2>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-relaxed">{t("whyToolEagleDesc")}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">{t("builtForSpeed")}</p>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{t("builtForSpeedDesc")}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">{t("creatorNativeUx")}</p>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{t("creatorNativeUxDesc")}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">{t("alwaysImproving")}</p>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{t("alwaysImprovingDesc")}</p>
            </div>
          </div>
        </section>

        <HomeStartHereSection />

        <section className="container py-8 max-w-3xl border-t border-slate-100">
          <ValueProofBlock variant="home" />
        </section>

        <HomeExampleOutputs />

        {trendingInjection}

        {children}
      </div>

      <SiteFooter />
    </main>
  );
}
