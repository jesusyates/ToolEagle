"use client";

/**
 * 中文站：可执行的第一步（抖音工具）+ 分层入口，避免「说明书 + 平铺链接」。
 */

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ZH } from "@/lib/zh-site/paths";

export function ZhDistributionPlatformHub() {
  const t = useTranslations("distributionDashboard");

  const douyinMore = [
    { href: ZH.douyin, labelKey: "zhHubCardDouyin" as const },
    { href: ZH.douyinTutorials, labelKey: "zhHubCardTutorials" as const },
    { href: ZH.douyinGuide, labelKey: "zhHubCardGuide" as const }
  ];

  const other = [
    { href: ZH.xiaohongshu, labelKey: "zhHubCardXhs" as const },
    { href: ZH.kuaishou, labelKey: "zhHubCardKs" as const },
    { href: ZH.sitemap, labelKey: "zhHubCardSitemap" as const }
  ];

  return (
    <div className="mt-8 space-y-10">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{t("zhHubTitle")}</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">{t("zhHubIntro")}</p>

        <Link
          href={ZH.douyinTools}
          className="mt-6 flex w-full max-w-md flex-col rounded-2xl border-2 border-emerald-400 bg-emerald-600 px-6 py-4 text-center text-white shadow-md transition hover:bg-emerald-700 hover:shadow-lg sm:py-5"
        >
          <span className="text-base font-bold sm:text-lg">{t("zhHubPrimaryCta")}</span>
          <span className="mt-1 text-xs font-normal text-emerald-100 sm:text-sm">{t("zhHubPrimaryHint")}</span>
        </Link>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("zhHubSectionDouyinMore")}</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {douyinMore.map(({ href, labelKey }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/60"
            >
              {t(labelKey)}
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("zhHubSectionOther")}</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {other.map(({ href, labelKey }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
            >
              {t(labelKey)}
            </Link>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <Link
          href="/dashboard/distribution"
          className="text-xs text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-slate-800"
        >
          {t("zhHubEnglishFooter")}
        </Link>
      </div>
    </div>
  );
}
