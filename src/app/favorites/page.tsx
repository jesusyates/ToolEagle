"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { safeCopyToClipboard } from "@/lib/clipboard";
import { getFavorites, removeFavorite, type FavoriteEntry } from "@/lib/storage";
import { ToolCopyButton } from "@/components/tools/ToolCopyButton";
import { DelegatedButton } from "@/components/DelegatedButton";
import { Star } from "lucide-react";

export default function FavoritesPage() {
  const t = useTranslations("common");
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  function handleRemove(id: string) {
    removeFavorite(id);
    setFavorites(getFavorites());
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="container pt-10 pb-16">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
              My Favorites
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Saved results
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Results you&apos;ve starred. Copy again or open the tool to generate more.
            </p>
          </div>

          {favorites.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50/50 p-10 text-center">
              <Star className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">No favorites yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Use any tool and click <span className="font-medium text-amber-600">Save</span> on a result to add it here.
              </p>
              <Link
                href="/tools"
                className="mt-6 inline-flex items-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition duration-150"
              >
                Browse tools
              </Link>
            </div>
          ) : (
            <ul className="mt-8 space-y-4">
              {favorites.map((fav) => (
                <li
                  key={fav.id}
                  data-result-item
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-500 mb-1">{fav.toolName}</p>
                      <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed line-clamp-4" data-copy-source>
                        {fav.text}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <ToolCopyButton
                        onClick={async () => { await safeCopyToClipboard(fav.text); }}
                        variant="primary"
                        getTextToCopy={(btn) => {
                          const item = btn.closest("[data-result-item]");
                          const src = item?.querySelector("[data-copy-source]");
                          return (src as HTMLElement)?.innerText?.trim() ?? null;
                        }}
                      />
                      <Link
                        href={`/tools/${fav.toolSlug}`}
                        className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:border-sky-500/80 hover:bg-sky-50 hover:text-sky-700 transition duration-150"
                      >
                        {t("use")}
                      </Link>
                      <DelegatedButton
                        onClick={() => handleRemove(fav.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition duration-150"
                        title={t("unsave")}
                      >
                        <Star className="h-4 w-4 fill-current" />
                        {t("unsave")}
                      </DelegatedButton>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
