"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";

/** Canonical post-package URL (not /tools/*) */
const PRIMARY_HREF = "/ai-caption-generator";

const MORE_TOOLS: { slug: string; label: string; blurb: string }[] = [
  {
    slug: "tiktok-caption-generator",
    label: "Caption Generator",
    blurb: "Scroll-stopping captions from one idea."
  },
  {
    slug: "hook-generator",
    label: "Hook Generator",
    blurb: "Openers that stop the scroll."
  },
  {
    slug: "tiktok-script-generator",
    label: "Script Generator",
    blurb: "Short-form script with hook and CTA."
  },
  {
    slug: "tiktok-idea-generator",
    label: "Idea Generator",
    blurb: "Angles and topics to post next."
  }
];

/** V109.3 layout + V109.4 hierarchy: one default path + “more generators” */
export function HomeQuickToolsSection() {
  const t = useTranslations("home");

  return (
    <section className="container pb-8 pt-2" aria-labelledby="home-quick-tools-heading">
      <h2 id="home-quick-tools-heading" className="text-xl sm:text-2xl font-semibold text-slate-900">
        {t("quickToolsHeading")}
      </h2>
      <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-relaxed">{t("quickToolsIntro")}</p>

      <div className="mt-6 max-w-lg">
        <div className="flex h-full flex-col rounded-2xl border border-sky-300 bg-white p-5 shadow-sm ring-1 ring-sky-200/80">
          <p className="mb-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {t("quickToolsRecommended")}
          </p>
          <h3 className="text-base font-semibold text-slate-900">{t("quickToolsPrimaryName")}</h3>
          <p className="mt-1 text-sm text-slate-600 leading-snug">{t("quickToolsPrimaryBlurb")}</p>
          <p className="mt-2 text-xs text-slate-500">{t("quickToolsPrimaryHint")}</p>
          <Link
            href={PRIMARY_HREF}
            className="mt-4 inline-flex min-h-[2.75rem] w-full items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition"
          >
            {t("ctaGeneratePackage")}
          </Link>
        </div>
      </div>

      <h3 className="mt-10 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {t("quickToolsMore")}
      </h3>
      <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MORE_TOOLS.map((tool) => (
          <li key={tool.slug}>
            <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
              <h4 className="text-base font-semibold text-slate-900">{tool.label}</h4>
              <p className="mt-1 flex-1 text-sm text-slate-600 leading-snug">{tool.blurb}</p>
              <Link
                href={`/tools/${tool.slug}`}
                className="mt-4 inline-flex min-h-[2.75rem] w-full items-center justify-center rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 transition"
              >
                {t("ctaOpenTool")}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
