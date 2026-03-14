"use client";

import Link from "next/link";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { ToolCopyButton } from "@/components/tools/ToolCopyButton";
import { useSyncOnLogin } from "@/hooks/useSyncOnLogin";
import { safeCopyToClipboard } from "@/lib/clipboard";
import { createClient } from "@/lib/supabase/client";
import { Star, History } from "lucide-react";

type Favorite = {
  id: string;
  toolSlug: string;
  toolName: string;
  text: string;
  savedAt: number;
};

type HistoryEntry = {
  id: string;
  toolSlug: string;
  toolName: string;
  input: string;
  items: string[];
  timestamp: number;
};

export function DashboardClient({
  userEmail,
  favorites: initialFavorites,
  history: initialHistory
}: {
  userEmail: string;
  favorites: Favorite[];
  history: HistoryEntry[];
}) {
  useSyncOnLogin();

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="container pt-10 pb-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                Dashboard
              </p>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-1">
                Your workspace
              </h1>
              <p className="text-sm text-slate-600 mt-1">{userEmail}</p>
            </div>
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-2">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-slate-900">Favorites</h2>
              </div>
              {initialFavorites.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-8 text-center">
                  <p className="text-slate-600">No favorites yet</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Save results from any tool to see them here.
                  </p>
                  <Link
                    href="/tools"
                    className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Browse tools
                  </Link>
                </div>
              ) : (
                <ul className="space-y-3">
                  {initialFavorites.slice(0, 10).map((fav) => (
                    <li
                      key={fav.id}
                      data-result-item
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <p className="text-xs font-medium text-slate-500 mb-1">
                        {fav.toolName}
                      </p>
                      <p className="text-sm text-slate-800 line-clamp-2 mb-3" data-copy-source>
                        {fav.text}
                      </p>
                      <div className="flex items-center gap-2">
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
                          className="text-sm font-medium text-sky-600 hover:underline"
                        >
                          Use tool
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {initialFavorites.length > 10 && (
                <Link
                  href="/favorites"
                  className="mt-4 inline-block text-sm font-medium text-sky-600 hover:underline"
                >
                  View all {initialFavorites.length} favorites →
                </Link>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <History className="h-5 w-5 text-slate-500" />
                <h2 className="text-lg font-semibold text-slate-900">
                  Recent generations
                </h2>
              </div>
              {initialHistory.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-8 text-center">
                  <p className="text-slate-600">No history yet</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Generate something to see it here.
                  </p>
                  <Link
                    href="/tools"
                    className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Browse tools
                  </Link>
                </div>
              ) : (
                <ul className="space-y-3">
                  {initialHistory.slice(0, 8).map((h) => (
                    <li
                      key={h.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <p className="text-xs font-medium text-slate-500 mb-1">
                        {h.toolName}
                      </p>
                      <p className="text-sm text-slate-700 line-clamp-2 mb-2">
                        {h.input}
                      </p>
                      <Link
                        href={`/tools/${h.toolSlug}`}
                        className="text-sm font-medium text-sky-600 hover:underline"
                      >
                        Use again
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
