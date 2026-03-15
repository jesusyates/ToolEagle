"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { FREE_DAILY_LIMIT } from "@/lib/usage";
import { ToolCopyButton } from "@/components/tools/ToolCopyButton";
import { useSyncOnLogin } from "@/hooks/useSyncOnLogin";
import { safeCopyToClipboard } from "@/lib/clipboard";
import { createClient } from "@/lib/supabase/client";
import { trackConversion } from "@/lib/analytics";
import { Star, History, FolderOpen } from "lucide-react";

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

type Project = {
  id: string;
  name: string;
  createdAt: number;
};

export function DashboardClient({
  userEmail,
  favorites: initialFavorites,
  history: initialHistory,
  projects: initialProjects,
  usageToday,
  plan,
  onboardingCompleted = true
}: {
  userEmail: string;
  favorites: Favorite[];
  history: HistoryEntry[];
  projects: Project[];
  usageToday: number;
  plan: "free" | "pro";
  onboardingCompleted?: boolean;
}) {
  useSyncOnLogin();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fromSignup = searchParams.get("from") === "signup";
    if (fromSignup) {
      trackConversion("signup");
      if (!onboardingCompleted) {
        window.location.href = "/onboarding";
        return;
      }
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams, onboardingCompleted]);

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
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/settings"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Creator profile
              </Link>
              <Link
                href="/dashboard/new-post"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Write post
              </Link>
              {plan === "free" && (
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Upgrade to Pro
                </Link>
              )}
            </div>
          </div>

          {plan === "free" && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
              <p className="text-sm font-medium text-slate-700">AI usage today</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {usageToday} / {FREE_DAILY_LIMIT}
              </p>
            </div>
          )}

          <div className="mt-10 grid gap-10 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <FolderOpen className="h-5 w-5 text-slate-500" />
                <h2 className="text-lg font-semibold text-slate-900">My Projects</h2>
              </div>
              {initialProjects.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-8 text-center">
                  <p className="text-slate-600">No projects yet</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Save content from tools to projects to organize your work.
                  </p>
                  <Link
                    href="/tools"
                    className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Browse tools
                  </Link>
                </div>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {initialProjects.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/projects/${p.id}`}
                        className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 hover:shadow-md"
                      >
                        <p className="font-medium text-slate-900">{p.name}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  <h2 className="text-lg font-semibold text-slate-900">Favorites</h2>
                </div>
                {initialFavorites.length > 0 && (
                  <Link
                    href="/dashboard/favorites"
                    className="text-sm font-medium text-sky-600 hover:underline"
                  >
                    View all →
                  </Link>
                )}
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
                  href="/dashboard/favorites"
                  className="mt-4 inline-block text-sm font-medium text-sky-600 hover:underline"
                >
                  View all {initialFavorites.length} favorites →
                </Link>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-slate-500" />
                  <h2 className="text-lg font-semibold text-slate-900">
                    Recent generations
                  </h2>
                </div>
                {initialHistory.length > 0 && (
                  <Link
                    href="/dashboard/history"
                    className="text-sm font-medium text-sky-600 hover:underline"
                  >
                    View all →
                  </Link>
                )}
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
