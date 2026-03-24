"use client";

import Link from "next/link";
import { MarketSelector } from "@/components/locale/MarketSelector";
import { ToolEagleLogoMark } from "@/components/brand/ToolEagleLogoMark";
import { AuthButton } from "@/components/auth/AuthButton";
import { ZH } from "@/lib/zh-site/paths";
import { CN_PLATFORMS } from "@/lib/zh-site/cn-platforms/config";

const xhs = CN_PLATFORMS.xiaohongshu;
const ks = CN_PLATFORMS.kuaishou;

type NavItem = {
  href: string;
  label: string;
  brand?: boolean;
  emphasize?: boolean;
  comingSoon?: boolean;
};

/** 主导航：抖音直链首页（无下拉） */
const navRest: NavItem[] = [
  { href: ZH.home, label: "首页", brand: true },
  { href: ZH.xiaohongshu, label: "小红书", comingSoon: !xhs.launched },
  { href: ZH.kuaishou, label: "快手", comingSoon: !ks.launched },
  { href: ZH.pricing, label: "定价" }
];

function navLinkClass(item: NavItem) {
  if (item.brand) {
    return "px-2.5 py-1.5 rounded-full font-semibold text-amber-950 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-300/70 shadow-sm hover:from-amber-100 hover:shadow transition";
  }
  if (item.comingSoon) {
    return "px-2.5 py-1.5 rounded-full text-slate-500 border border-dashed border-slate-200 hover:bg-amber-50 hover:text-amber-900 transition";
  }
  return "px-2.5 py-1.5 rounded-full hover:bg-red-50 hover:text-red-800 transition";
}

const douyinNavClass =
  "px-2.5 py-1.5 rounded-full font-bold text-red-900 bg-red-50 border border-red-200/80 hover:bg-red-100 transition";

/**
 * 单一 `<nav>` 输出，避免桌面/移动两套相同链接重复出现在 DOM（抓取与无障碍重复）。
 */
export function ZhSiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-page/90 backdrop-blur sticky top-0 z-40">
      <div className="container py-3 flex flex-col gap-3">
        <div className="flex flex-nowrap items-center justify-between gap-3 min-h-[3.5rem]">
          <Link href={ZH.home} className="flex items-center gap-2.5 min-w-0 shrink-0">
            <ToolEagleLogoMark variant="cn" />
            <div className="min-w-0">
              <p className="text-lg font-semibold tracking-tight text-slate-900 truncate" translate="no">
                ToolEagle
              </p>
              <p className="text-xs text-slate-600 truncate">短视频 · 自媒体 · 涨粉效率</p>
            </div>
          </Link>

          <div className="flex flex-nowrap items-center gap-2 justify-end shrink min-w-0">
            <MarketSelector analyticsSource="zh_header" />
            <AuthButton
              loginAnalyticsSource="zh_header"
              showSignup
              loginNextPath="/zh"
              accountHref={ZH.dashboard}
              billingHref="/zh/dashboard/billing"
              settingsHref={ZH.dashboardSettings}
              signOutRedirectTo="/zh"
            />
          </div>
        </div>

        <nav
          className="flex flex-wrap items-center gap-1.5 text-xs text-slate-700 md:text-sm pb-0.5"
          aria-label="主导航"
        >
          {navRest.slice(0, 1).map((item) => (
            <Link key={item.href} href={item.href} className={navLinkClass(item)}>
              {item.label}
            </Link>
          ))}
          <Link href={ZH.douyin} className={douyinNavClass}>
            抖音
          </Link>
          {navRest.slice(1).map((item) => (
            <Link key={item.href} href={item.href} className={navLinkClass(item)}>
              {item.label}
              {item.comingSoon ? <span className="text-[10px] text-amber-700"> soon</span> : null}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
