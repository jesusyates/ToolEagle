"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ToolCopyButton } from "@/components/tools/ToolCopyButton";
import { safeCopyToClipboard } from "@/lib/clipboard";
import { ZH } from "@/lib/zh-site/paths";
import { zhDashboardToolDisplayName, zhDashboardToolHref } from "@/lib/zh-dashboard-scope";

type Favorite = {
  id: string;
  toolSlug: string;
  toolName: string;
  text: string;
  savedAt: number;
};

export function FavoritesClient({
  initialFavorites,
  variant = "en"
}: {
  initialFavorites: Favorite[];
  /** `zh`：链接与展示名对齐抖音专栏，浏览入口走 `/zh/douyin` */
  variant?: "en" | "zh";
}) {
  const t = useTranslations("dashboard");
  const favorites = initialFavorites;
  const isZh = variant === "zh";

  if (favorites.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50/50 p-12 text-center">
        <p className="text-slate-600 font-medium">{t("noFavoritesYet")}</p>
        <p className="mt-1 text-sm text-slate-500">{t("noFavoritesHint")}</p>
        {isZh && (
          <p className="text-xs text-slate-400 mt-2">{t("zhDashboardScopeHint")}</p>
        )}
        <Link
          href={isZh ? ZH.douyin : "/tools"}
          className="mt-4 inline-flex rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
        >
          {t("browseTools")}
        </Link>
      </div>
    );
  }

  return (
    <ul className="mt-8 space-y-4">
      {favorites.map((fav) => (
        <li
          key={fav.id}
          data-result-item
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 transition"
        >
          <p className="text-xs font-medium text-slate-500">
            {isZh ? zhDashboardToolDisplayName(fav.toolSlug, fav.toolName) : fav.toolName} ·{" "}
            {new Date(fav.savedAt).toLocaleString()}
          </p>
          <p className="mt-2 text-sm text-slate-800 line-clamp-3" data-copy-source>
            {fav.text}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <ToolCopyButton
              onClick={async () => {
                await safeCopyToClipboard(fav.text);
              }}
              variant="primary"
              getTextToCopy={(btn) => {
                const item = btn.closest("[data-result-item]");
                const src = item?.querySelector("[data-copy-source]");
                return (src as HTMLElement)?.innerText?.trim() ?? null;
              }}
            />
            <Link
              href={isZh ? zhDashboardToolHref(fav.toolSlug) : `/tools/${fav.toolSlug}`}
              className="text-sm font-medium text-sky-600 hover:underline"
            >
              {t("useTool")}
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
