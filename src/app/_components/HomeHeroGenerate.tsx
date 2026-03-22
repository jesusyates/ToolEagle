"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { UpgradeLink } from "@/components/monetization/UpgradeLink";

/**
 * V71: Homepage focus shift - direct input + generate button as first screen
 */
export function HomeHeroGenerate() {
  const t = useTranslations("home");
  const router = useRouter();
  const [input, setInput] = useState("");

  function handleGenerate() {
    const trimmed = input.trim();
    if (trimmed) {
      router.push(`/tools/tiktok-caption-generator?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/tools/tiktok-caption-generator");
    }
  }

  return (
    <section className="container pt-10 pb-12">
      <div className="max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {t("heroTagline")}
        </div>

        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">
          {t("heroTitle")}
        </h1>
        <p className="mt-2 text-lg text-slate-600 max-w-xl">
          {t("heroSubtitle")}
        </p>

        <div className="mt-6 rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. morning routine for productivity, travel vlog tips..."
            className="w-full min-h-[100px] resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400/80"
            maxLength={300}
          />
          <button
            onClick={handleGenerate}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-sky-700 transition duration-150"
          >
            {t("heroGenerateCta")}
            <span className="text-sky-200">→</span>
          </button>
          <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <p className="text-xs font-medium text-slate-700">{t("heroUpgradeTeaser")}</p>
            <UpgradeLink className="inline-flex justify-center rounded-xl border-2 border-slate-900 bg-white px-4 py-2 text-sm font-bold text-slate-900 hover:bg-slate-50">
              {t("heroUpgradeLink")}
            </UpgradeLink>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          {t("heroFootnote")}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <a
            href="/tools/hook-generator"
            className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
          >
            Hook Generator
          </a>
          <a
            href="/tools/youtube-title-generator"
            className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
          >
            YouTube Title Generator
          </a>
          <a
            href="/tools"
            className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-700 hover:bg-sky-100 transition"
          >
            Browse all tools →
          </a>
        </div>
      </div>
    </section>
  );
}
