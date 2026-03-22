import Link from "next/link";
import { Sparkles, Zap, TrendingUp, ArrowRight, PlayCircle } from "lucide-react";
import { ZH } from "@/lib/zh-site/paths";
import { ZhPricingLink } from "@/components/monetization/ZhPricingLink";
import { ZH_BRAND_SUBLINE, ZH_BRAND_TAGLINE } from "@/config/zh-brand";

const features = [
  {
    icon: Sparkles,
    title: "黄金开头",
    desc: "前两秒停滑句式，同城 / 带货 / 知识号都能对号入座。"
  },
  {
    icon: Zap,
    title: "口播 + 描述区一体",
    desc: "五段气口进提词器，文案包同步话题与引导，少改一版是一版。"
  },
  {
    icon: TrendingUp,
    title: "评论与私信转化",
    desc: "把「评什么 / 私信领什么」写进可执行指令，链路不断。"
  }
] as const;

/**
 * 抖音向海报首屏 — 仅用于中文首页；/zh/douyin 为场景分类页，不再使用本组件。
 */
export function DouyinLandingHero() {
  return (
    <section className="relative min-h-[min(92vh,920px)] flex flex-col justify-center overflow-hidden">
      {/* 背景层 */}
      <div className="absolute inset-0 bg-slate-950" aria-hidden />
      <div
        className="absolute inset-0 bg-gradient-to-br from-red-950/95 via-[#0f172a] to-slate-950"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-15%,rgba(239,68,68,0.42),transparent_55%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_100%_10%,rgba(251,191,36,0.18),transparent)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_40%_35%_at_0%_80%,rgba(56,189,248,0.12),transparent)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.35] bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]"
        aria-hidden
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white to-transparent pointer-events-none"
        aria-hidden
      />

      <div className="relative z-10 container max-w-5xl px-4 pt-8 pb-16 md:pt-14 md:pb-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-amber-100/90 backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
          抖音创作 · 平台说明
        </div>

        <p className="mt-6 text-sm font-medium text-slate-300/95 max-w-xl">
          面向抖音的生成器、模板与长文入口；下方按「获取流量 → 写文案 → 结构 → 转化 → 账号」场景展开。
        </p>

        <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.12]">
          <span className="block bg-gradient-to-r from-white via-red-50 to-amber-100 bg-clip-text text-transparent drop-shadow-sm">
            抖音创作者专栏
          </span>
          <span className="mt-3 block text-2xl sm:text-3xl md:text-4xl font-semibold text-slate-200/95">
            {ZH_BRAND_TAGLINE}
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-slate-300/95 whitespace-pre-line">
          {ZH_BRAND_SUBLINE}
        </p>

        <p className="mt-6 max-w-2xl text-lg sm:text-xl leading-relaxed text-slate-300/95">
          按<strong className="text-white">抖音完播、同城与带货语境</strong>
          拆好的钩子、文案包与口播气口；模板库与生成器互链，分享链接带完整标题与描述预览。
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href={ZH.douyin}
            className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-7 py-4 text-base font-bold text-white shadow-[0_20px_50px_-12px_rgba(220,38,38,0.55)] ring-1 ring-white/10 transition hover:from-red-500 hover:to-red-600 hover:shadow-[0_24px_60px_-12px_rgba(220,38,38,0.65)]"
          >
            <PlayCircle className="h-5 w-5 opacity-90" aria-hidden />
            进入抖音 · 按场景找工具
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
          </Link>
          <Link
            href={ZH.douyinCaption}
            className="inline-flex items-center rounded-2xl border border-white/20 bg-white/5 px-6 py-4 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
          >
            先用文案包试一次
          </Link>
          <ZhPricingLink
            conversionSource="zh_douyin_landing"
            hash="#cn-pro-checkout"
            className="inline-flex items-center rounded-2xl border border-amber-400/30 bg-amber-500/10 px-6 py-4 text-base font-semibold text-amber-100 transition hover:bg-amber-500/15"
          >
            Pro 权益
          </ZhPricingLink>
        </div>

        <ul className="mt-16 grid gap-5 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <li
              key={title}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md transition hover:border-red-400/25 hover:bg-white/[0.07]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-red-500/30 to-amber-500/20 text-amber-100 ring-1 ring-white/10">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <h2 className="mt-4 text-lg font-bold text-white">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{desc}</p>
            </li>
          ))}
        </ul>

        <p className="mt-14 text-center text-sm text-slate-500">
          向下滚动查看平台入口与各平台 · 或先进入{" "}
          <Link href={ZH.douyin} className="font-semibold text-red-300 hover:text-red-200 underline-offset-2 hover:underline">
            抖音场景页
          </Link>
          {" · "}
          <Link href={ZH.douyinHub} className="font-semibold text-red-300 hover:text-red-200 underline-offset-2 hover:underline">
            完整工作台
          </Link>
        </p>
      </div>
    </section>
  );
}
