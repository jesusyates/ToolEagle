import Link from "next/link";
import { ArrowUpRight, Globe2 } from "lucide-react";
import { GoEnglishHomeButton } from "@/components/locale/GoEnglishHomeButton";

const PLATFORMS = [
  { label: "TikTok", href: "/tiktok-tools", hint: "工具与增长页" },
  { label: "Instagram", href: "/instagram-tools", hint: "工具合集" },
  { label: "YouTube", href: "/youtube-tools", hint: "工具合集" }
] as const;

/**
 * 中文首页：全球站（英文）入口 — 与同屏「原则」卡片同为暖色深底，避免青蓝块与首屏割裂。
 */
export function ZhGlobalCreativeEntry() {
  return (
    <div className="mt-14 scroll-mt-24" id="zh-global-creative">
      <div className="relative overflow-hidden rounded-2xl border border-amber-800/45 bg-gradient-to-br from-stone-900/55 via-stone-950/90 to-[#14100d] p-5 shadow-[0_20px_44px_-14px_rgba(0,0,0,0.55)] ring-1 ring-amber-500/[0.12] md:p-7">
        <div
          className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-amber-600/[0.12] blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-8">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200/90">
              <Globe2 className="h-4 w-4 shrink-0 text-amber-300/95" aria-hidden />
              海外创作者站（英文界面）
            </p>
            <h2 className="mt-2 text-xl font-bold leading-snug text-[#fef3c7] sm:text-2xl md:text-[1.65rem] drop-shadow-[0_1px_12px_rgba(180,83,9,0.2)]">
              创作：TikTok · Instagram · YouTube
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-300/95">
              主要做海外平台？直接进英文站，使用对应工具、示例与教程（界面为英文）。
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center md:flex-col md:items-stretch lg:flex-row lg:items-center">
            <GoEnglishHomeButton className="inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-600 to-orange-700 px-6 text-base font-bold text-stone-950 shadow-lg shadow-amber-950/40 ring-1 ring-amber-400/25 transition hover:from-amber-500 hover:to-orange-600 active:scale-[0.99]">
              进入全球主站首页
              <ArrowUpRight className="h-5 w-5 shrink-0" aria-hidden />
            </GoEnglishHomeButton>
          </div>
        </div>

        <div className="relative mt-6 border-t border-amber-900/35 pt-5">
          <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-amber-200/75 md:text-left">
            按平台直达（英文）
          </p>
          <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {PLATFORMS.map(({ label, href, hint }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex min-h-[3.25rem] flex-col justify-center rounded-xl border border-amber-900/35 bg-stone-950/55 px-4 py-3 text-center backdrop-blur-sm transition hover:border-amber-600/35 hover:bg-stone-900/65 active:scale-[0.99] sm:min-h-[4rem] sm:text-left"
                >
                  <span className="text-base font-bold text-amber-50">{label}</span>
                  <span className="mt-0.5 text-xs text-stone-400">{hint}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
