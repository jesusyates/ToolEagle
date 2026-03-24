"use client";

import Link from "next/link";
import { EnglishHomeLink } from "@/components/locale/EnglishHomeLink";
import { FeedbackFooterTrigger } from "@/components/feedback/FeedbackFooterTrigger";
import { SupportContactFooterTrigger } from "@/components/support/SupportContactFooterTrigger";
import { ZH } from "@/lib/zh-site/paths";

const links = [
  { href: ZH.home, label: "中文站介绍" },
  { href: ZH.douyin, label: "抖音专栏" },
  { href: ZH.tiktokCaption, label: "短视频文案包" },
  { href: ZH.hook, label: "钩子生成" },
  { href: ZH.aiCaption, label: "文案包" },
  { href: ZH.growthKit, label: "增长指南" },
  { href: ZH.pricing, label: "定价说明" },
  { href: ZH.sitemap, label: "站点地图" },
  { href: ZH.privacy, label: "隐私" },
  { href: ZH.terms, label: "条款" }
];

/** V100.2 — No footer QR; low-key support link only */
export function ZhSiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-gradient-to-b from-slate-50/50 to-white mt-auto">
      <div className="container py-10 space-y-6">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sky-800 font-medium hover:underline">
              {l.label}
            </Link>
          ))}
          <EnglishHomeLink className="text-slate-500 hover:text-slate-800" title="ToolEagle 英文主站">
            英文主站 →
          </EnglishHomeLink>
        </div>

        <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>© {new Date().getFullYear()} ToolEagle</span>
          <span className="text-slate-300">·</span>
          <Link href={ZH.support} className="text-slate-400 hover:text-red-800 hover:underline">
            支持我们
          </Link>
          <span className="text-slate-300">·</span>
          <FeedbackFooterTrigger localeUi="zh" />
          <span className="text-slate-300">·</span>
          <SupportContactFooterTrigger />
        </p>
      </div>
    </footer>
  );
}
