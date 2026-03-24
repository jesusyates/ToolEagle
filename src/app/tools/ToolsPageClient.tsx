"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import {
  toolsForEnglishSite,
  toolCategories,
  type ToolCategory
} from "@/config/tools";
import {
  PLATFORM_TOOL_HUB_CARDS,
  TOOL_CATEGORY_CARD_VISUAL
} from "@/config/tool-category-card";
import { toolCategoryToSegment } from "@/lib/tools/tool-category-url";
import {
  filterToolsBySearch,
  rankToolSearchResults
} from "@/lib/tools/tool-search";
import { isPlatformHubScopedSlug } from "@/lib/tools/platform-scope";
import { PlayIcon } from "@heroicons/react/24/solid";
import { InstagramMark, TikTokMark } from "@/components/icons/PlatformBrandGlyphs";
import { CategoryHubIcon } from "@/components/icons/CategoryHubIcons";

/** Platform chips: filled marks only (stroke + Lucide failed as “white squares” on some clients). */
function PlatformHubCardIcon({
  platform
}: {
  platform: (typeof PLATFORM_TOOL_HUB_CARDS)[number]["platform"];
}) {
  if (platform === "tiktok") {
    return <TikTokMark className="h-7 w-7 shrink-0 text-white" />;
  }
  if (platform === "instagram") {
    return <InstagramMark className="h-7 w-7 shrink-0 text-white" />;
  }
  return (
    <PlayIcon
      className="h-7 w-7 shrink-0 text-white"
      fill="#ffffff"
      style={{ color: "#ffffff", fill: "#ffffff" }}
      aria-hidden
    />
  );
}

/** Category pages: semantic tools only (not TikTok/YouTube/Instagram slug-scoped). */
function categoryToolCount(category: ToolCategory): number {
  return toolsForEnglishSite.filter(
    (t) => t.category === category && !isPlatformHubScopedSlug(t.slug)
  ).length;
}

export function ToolsPageClient() {
  const t = useTranslations("tools");
  const [search, setSearch] = useState("");

  const searchResults = useMemo(() => {
    const q = search.trim();
    if (!q) return [];
    const matched = filterToolsBySearch(toolsForEnglishSite, q);
    return rankToolSearchResults(matched, q).slice(0, 12);
  }, [search]);

  const showSearchPanel = search.trim().length > 0;

  /** Hub only lists categories that have ≥1 listable tool (not platform-scoped slugs). */
  const categoriesWithTools = toolCategories.filter((c) => categoryToolCount(c) > 0);

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="container pt-10 pb-16">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
              {t("title")}
            </p>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
              {t("subtitle")}
            </h1>
            <p className="text-base text-slate-600 leading-relaxed">{t("intro")}</p>
          </div>

          <div className="mt-8 max-w-xl">
            <label htmlFor="tools-hub-search" className="sr-only">
              {t("searchLabel")}
            </label>
            <div className="relative">
              <input
                id="tools-hub-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setSearch("");
                }}
                placeholder={t("searchPlaceholder")}
                autoComplete="off"
                list={search.trim().length === 0 ? "tools-hub-datalist" : undefined}
                className="w-full rounded-xl border border-sky-400 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-500 transition duration-150"
              />
              <datalist id="tools-hub-datalist">
                {toolsForEnglishSite.map((tool) => (
                  <option key={tool.slug} value={tool.name} />
                ))}
              </datalist>

              {showSearchPanel && (
                <div
                  className="absolute left-0 right-0 top-full z-30 mt-1 max-h-[min(22rem,70vh)] overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                  aria-label={t("searchSuggestionsLabel")}
                >
                  {searchResults.length === 0 ? (
                    <p className="px-3 py-3 text-sm text-slate-600">{t("searchNoResults")}</p>
                  ) : (
                    searchResults.map((tool) => (
                      <Link
                        key={tool.slug}
                        href={`/tools/${tool.slug}`}
                        className="flex flex-col gap-0.5 border-b border-slate-100 px-3 py-2.5 last:border-b-0 hover:bg-sky-50"
                      >
                        <span className="text-sm font-medium text-slate-900">{tool.name}</span>
                        <span className="text-xs text-slate-500">{tool.category}</span>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-600">{t("searchHintHub")}</p>
          </div>

          <section className="mt-12">
            <h2 className="text-lg font-semibold text-slate-900">{t("browseByPlatform")}</h2>
            <p className="mt-2 text-sm text-slate-600">{t("browseByPlatformSub")}</p>
            <div className="mt-6 grid grid-cols-1 items-start gap-4 sm:grid-cols-3">
              {PLATFORM_TOOL_HUB_CARDS.map(({ platform, href, iconWrap, card }) => {
                const platformTools = toolsForEnglishSite.filter((x) =>
                  x.slug.startsWith(`${platform}-`)
                );
                return (
                  <Link
                    key={platform}
                    href={href}
                    className={`group relative flex flex-col rounded-2xl p-5 transition ${card}`}
                  >
                    <div
                      className={`absolute right-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-xl text-white ${iconWrap}`}
                    >
                      <PlatformHubCardIcon platform={platform} />
                    </div>
                    <h3 className="pr-[4.5rem] text-lg font-semibold tracking-tight text-slate-900">
                      {t(`platformCardTitle.${platform}`)}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600 pr-[4.5rem]">
                      {t(`platformBlurbs.${platform}`)}
                    </p>
                    <div className="mt-4 flex items-end justify-between border-t border-slate-200 pt-3">
                      <span className="text-xs font-medium tabular-nums text-slate-500">
                        {t("platformCardCount", {
                          count: platformTools.length,
                          label: t(`platformLabels.${platform}`)
                        })}
                      </span>
                      <span className="text-sm font-semibold text-sky-700 group-hover:underline">
                        {t("platformCardCta")}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-lg font-semibold text-slate-900">{t("browseByCategory")}</h2>
            <p className="mt-2 text-sm text-slate-600">{t("browseByCategorySub")}</p>
            <div className="mt-6 grid grid-cols-1 items-start gap-4 sm:grid-cols-3">
              {categoriesWithTools.map((category) => {
                const count = categoryToolCount(category);
                const visual = TOOL_CATEGORY_CARD_VISUAL[category];
                return (
                  <Link
                    key={category}
                    href={`/tools/category/${toolCategoryToSegment(category)}`}
                    className={`group relative flex flex-col rounded-2xl p-5 transition ${visual.card}`}
                  >
                    <div
                      className={`absolute right-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-xl text-white ${visual.iconWrap}`}
                      aria-hidden
                    >
                      <CategoryHubIcon category={category} className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="pr-[4.5rem] text-lg font-semibold tracking-tight text-slate-900">
                      {category}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600 pr-[4.5rem]">
                      {t(`categoryBlurbs.${category}`)}
                    </p>
                    <div className="mt-4 flex items-end justify-between border-t border-slate-200 pt-3">
                      <span
                        className={
                          count === 0
                            ? "text-xs font-medium tabular-nums text-slate-400"
                            : "text-xs font-medium tabular-nums text-slate-500"
                        }
                      >
                        {t("categoryCardCount", { count })}
                      </span>
                      <span className="text-sm font-semibold text-sky-700 group-hover:underline">
                        {t("categoryCardCta")}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
