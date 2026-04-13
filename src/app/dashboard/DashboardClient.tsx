"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AuthSuccessBroadcast } from "@/components/auth/AuthSuccessBroadcast";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { ZH } from "@/lib/zh-site/paths";
import { zhDashboardToolDisplayName, zhDashboardToolHref } from "@/lib/zh-dashboard-scope";
import { FREE_DAILY_LIMIT } from "@/lib/usage";
import { ToolCopyButton } from "@/components/tools/ToolCopyButton";
import { useSyncOnLogin } from "@/hooks/useSyncOnLogin";
import { safeCopyToClipboard } from "@/lib/clipboard";
import { trackConversion } from "@/lib/analytics";
import { Star, History, FolderOpen } from "lucide-react";
import { GrowthMissionBlock } from "@/components/dashboard/GrowthMissionBlock";
import { ZhCreditsSnapshotCard } from "@/components/zh/ZhCreditsSnapshotCard";

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
  onboardingCompleted = true,
  variant = "en",
  showRevenueNav = false,
  showAdminSeoLinks = false
}: {
  userEmail: string;
  favorites: Favorite[];
  history: HistoryEntry[];
  projects: Project[];
  usageToday: number;
  plan: "free" | "pro";
  onboardingCompleted?: boolean;
  /** `zh`：中文顶栏/底栏，链接走 `/zh/dashboard/*` */
  variant?: "en" | "zh";
  /** 全站收入 / 联盟运营页，仅 `OPERATOR_*` 用户显示 */
  showRevenueNav?: boolean;
  /** SEO 内容中心入口 — `profiles.role === "admin"` only */
  showAdminSeoLinks?: boolean;
}) {
  useSyncOnLogin();
  const searchParams = useSearchParams();
  const t = useTranslations("dashboard");
  const isZh = variant === "zh";
  const dashPrefix = isZh ? "/zh" : "";

  const toolHref = (slug: string) =>
    isZh ? zhDashboardToolHref(slug) : `/tools/${slug}`;
  const toolLabel = (slug: string, stored: string) =>
    isZh ? zhDashboardToolDisplayName(slug, stored) : stored;

  useEffect(() => {
    const fromSignup = searchParams?.get("from") === "signup";
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
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <AuthSuccessBroadcast />
      {!isZh ? <SiteHeader /> : null}

      <div className="flex-1">
        <section className="container pt-10 pb-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                {t("title")}
              </p>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-1">
                {t("yourWorkspace")}
              </h1>
              <p className="text-sm text-slate-600 mt-1">{userEmail}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`${dashPrefix}/dashboard/settings`}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {t("creatorProfile")}
              </Link>
              <Link
                href={`${dashPrefix}/dashboard/billing`}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {isZh ? "算力 / 订单" : "Credits / orders"}
              </Link>
              <Link
                href={`${dashPrefix}/dashboard/new-post`}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {t("writePost")}
              </Link>
              <Link
                href={isZh ? "/zh/dashboard/distribution" : "/dashboard/distribution"}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                🚀 {t("distribution")}
              </Link>
              {showRevenueNav && (
                <Link
                  href={isZh ? "/zh/dashboard/revenue" : "/dashboard/revenue"}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  💰 {t("revenue")}
                </Link>
              )}
              {showAdminSeoLinks && (
                <Link
                  href="/admin/seo"
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-2.5 text-sm font-semibold text-amber-950 hover:bg-amber-100"
                >
                  SEO内容中心
                </Link>
              )}
              {plan === "free" && (
                <Link
                  href={isZh ? ZH.pricing : "/pricing"}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  {t("upgradeToPro")}
                </Link>
              )}
            </div>
          </div>

          {!isZh && (
            <GrowthMissionBlock distributionHref="/dashboard/distribution" />
          )}

          {isZh && (
            <div className="mt-8">
              <ZhCreditsSnapshotCard />
            </div>
          )}

          {plan === "free" && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
              <p className="text-sm font-medium text-slate-700">{t("aiUsageToday")}</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {usageToday} / {FREE_DAILY_LIMIT}
              </p>
            </div>
          )}

          <div className="mt-10 grid gap-10 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <FolderOpen className="h-5 w-5 text-slate-500" />
                <h2 className="text-lg font-semibold text-slate-900">{t("myProjects")}</h2>
              </div>
              {initialProjects.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-8 text-center">
                  <p className="text-slate-600">{t("noProjectsYet")}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {t("noProjectsHint")}
                  </p>
                  <Link
                    href={isZh ? ZH.douyin : "/tools"}
                    className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    {t("browseTools")}
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
                  <h2 className="text-lg font-semibold text-slate-900">{t("favorites")}</h2>
                </div>
                {initialFavorites.length > 0 && (
                  <Link
                    href={`${dashPrefix}/dashboard/favorites`}
                    className="text-sm font-medium text-sky-600 hover:underline"
                  >
                    {t("viewAll")} →
                  </Link>
                )}
              </div>
              {initialFavorites.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-8 text-center">
                  <p className="text-slate-600">{t("noFavoritesYet")}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {t("noFavoritesHint")}
                  </p>
                  {isZh && (
                    <p className="text-xs text-slate-400 mt-2">{t("zhDashboardScopeHint")}</p>
                  )}
                  <Link
                    href={isZh ? ZH.douyin : "/tools"}
                    className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    {t("browseTools")}
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
                        {toolLabel(fav.toolSlug, fav.toolName)}
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
                          href={toolHref(fav.toolSlug)}
                          className="text-sm font-medium text-sky-600 hover:underline"
                        >
                          {t("useTool")}
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {initialFavorites.length > 10 && (
                <Link
                  href={`${dashPrefix}/dashboard/favorites`}
                  className="mt-4 inline-block text-sm font-medium text-sky-600 hover:underline"
                >
                  {t("viewAll")} {initialFavorites.length} {t("favorites")} →
                </Link>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-slate-500" />
                  <h2 className="text-lg font-semibold text-slate-900">
                    {t("recentGenerations")}
                  </h2>
                </div>
                {initialHistory.length > 0 && (
                  <Link
                    href={`${dashPrefix}/dashboard/history`}
                    className="text-sm font-medium text-sky-600 hover:underline"
                  >
                    {t("viewAll")} →
                  </Link>
                )}
              </div>
              {initialHistory.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-8 text-center">
                  <p className="text-slate-600">{t("noHistoryYet")}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {t("noHistoryHint")}
                  </p>
                  {isZh && (
                    <p className="text-xs text-slate-400 mt-2">{t("zhDashboardScopeHint")}</p>
                  )}
                  <Link
                    href={isZh ? ZH.douyin : "/tools"}
                    className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    {t("browseTools")}
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
                        {toolLabel(h.toolSlug, h.toolName)}
                      </p>
                      <p className="text-sm text-slate-700 line-clamp-2 mb-2">
                        {h.input}
                      </p>
                      <Link
                        href={toolHref(h.toolSlug)}
                        className="text-sm font-medium text-sky-600 hover:underline"
                      >
                        {t("useAgain")}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </div>

      {!isZh ? <SiteFooter /> : null}
    </main>
  );
}
