import Link from "next/link";
import { Heart, Shield, Compass } from "lucide-react";
import { ZH } from "@/lib/zh-site/paths";
import { ZhPricingLink } from "@/components/monetization/ZhPricingLink";
import { ZhGlobalCreativeEntry } from "@/components/zh/ZhGlobalCreativeEntry";
import { ZH_BRAND_SUBLINE, ZH_BRAND_TAGLINE } from "@/config/zh-brand";

const pillars = [
  {
    icon: Compass,
    title: "按平台写，不套空话",
    desc: "抖音、同城、带货、知识向——语境对齐真实创作者，而不是堆词套模板的演示稿。"
  },
  {
    icon: Shield,
    title: "合规与信任打底",
    desc: "内容安全与平台语境写进生成链路；付费与打赏走微信/支付宝，路径透明。"
  },
  {
    icon: Heart,
    title: "转化留在站内闭环",
    desc: "从钩子、口播到描述区与评论引导，尽量在站内完成，少让你来回拼凑。"
  }
] as const;

/** 与首屏深棕金同一套暖色：奶油底 + 琥珀边，避免冷白/冷绿切断叙事 */
const exploreCardClass =
  "group flex flex-col rounded-2xl border border-amber-200/30 bg-gradient-to-b from-[#fcfaf6] to-[#f3ece3] p-6 text-left shadow-[0_14px_40px_-10px_rgba(12,8,6,0.55)] ring-1 ring-amber-950/[0.06] transition duration-200 hover:-translate-y-0.5 hover:border-amber-400/45 hover:from-[#fffefb] hover:to-[#faf5ec] hover:shadow-[0_22px_48px_-14px_rgba(120,53,15,0.22)]";

/**
 * 中文站整站品牌首屏 — 与 zh-brand 口号一致。
 */
export function ZhStationBrandHero() {
  return (
    <section className="relative min-h-[min(90vh,880px)] flex flex-col justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[#14110d]" aria-hidden />
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#2a1810]/90 via-[#1a1512] to-[#0f0d0b]"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-20%,rgba(180,83,9,0.35),transparent_58%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_45%_40%_at_100%_20%,rgba(234,179,8,0.12),transparent)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_35%_30%_at_0%_70%,rgba(248,250,252,0.06),transparent)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.12] bg-[repeating-linear-gradient(-45deg,transparent,transparent_3px,rgba(253,230,138,0.08)_3px,rgba(253,230,138,0.08)_4px)] [mask-image:radial-gradient(ellipse_at_center,black_15%,transparent_70%)]"
        aria-hidden
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-[#faf8f5] to-transparent pointer-events-none"
        aria-hidden
      />

      <div className="relative z-10 container max-w-5xl px-4 pt-10 pb-16 md:pt-14 md:pb-20">
        <p className="text-center text-[13px] font-medium tracking-[0.22em] text-amber-200/90">
          短视频 · 自媒体 · 涨粉与变现
        </p>
        <h1 className="mt-6 text-center font-serif text-4xl sm:text-5xl md:text-[3.15rem] font-bold leading-[1.25] text-[#fef3c7] drop-shadow-[0_2px_24px_rgba(180,83,9,0.35)]">
          {ZH_BRAND_TAGLINE}
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-center text-base sm:text-lg leading-relaxed text-stone-300/95 whitespace-pre-line">
          {ZH_BRAND_SUBLINE}
        </p>

        <p className="mx-auto mt-6 max-w-2xl text-center text-sm sm:text-base leading-relaxed text-amber-100/95">
          我们懂创作者的节奏：要涨粉、要爆款、要把播放变成评论和私信。
        </p>

        <ul className="mt-16 grid gap-6 sm:grid-cols-3">
          {pillars.map(({ icon: Icon, title, desc }) => (
            <li
              key={title}
              className="rounded-2xl border border-amber-900/30 bg-gradient-to-b from-stone-900/50 to-stone-950/80 p-6 shadow-xl shadow-black/20 backdrop-blur-sm transition hover:border-amber-600/25 hover:from-stone-900/70"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-600/30 to-orange-900/40 text-amber-200 ring-1 ring-amber-500/20">
                <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
              </div>
              <h2 className="mt-4 text-center text-lg font-bold text-amber-50">{title}</h2>
              <p className="mt-3 text-center text-sm leading-relaxed text-stone-400">{desc}</p>
            </li>
          ))}
        </ul>

        <ZhGlobalCreativeEntry />

        <div id="zh-station-explore" className="relative mt-20 scroll-mt-20 pt-2">
          <div
            className="pointer-events-none absolute left-1/2 top-0 h-px w-[min(100%,20rem)] -translate-x-1/2 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent"
            aria-hidden
          />
          <h2 className="text-center text-xl font-bold tracking-tight text-[#fef3c7] drop-shadow-[0_1px_12px_rgba(180,83,9,0.25)] md:text-2xl">
            从这里开始逛中文站
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Link href={ZH.douyin} className={exploreCardClass}>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-red-900/90">主战场</span>
              <span className="mt-2 text-lg font-bold text-stone-900">抖音 · 从选题到发布</span>
              <span className="mt-2 flex-1 text-sm leading-relaxed text-stone-600">
                场景化工具与工作流入口；本土语境优先，其次才是通用短视频能力。
              </span>
              <span className="mt-4 text-sm font-semibold text-red-800 transition group-hover:text-red-700 group-hover:underline">
                前往 →
              </span>
            </Link>
            <Link href={ZH.growthKit} className={exploreCardClass}>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-900/90">开工</span>
              <span className="mt-2 text-lg font-bold text-stone-900">增长指南 · 可执行路径</span>
              <span className="mt-2 flex-1 text-sm leading-relaxed text-stone-600">
                把钩子、文案与标签串成闭环；示例与入口偏抖音日更节奏。
              </span>
              <span className="mt-4 text-sm font-semibold text-amber-900 transition group-hover:text-amber-800 group-hover:underline">
                前往 →
              </span>
            </Link>
            <ZhPricingLink
              conversionSource="zh_home_explore_grid"
              hash="#cn-credits-checkout"
              className={exploreCardClass}
            >
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-950/85">付费</span>
              <span className="mt-2 text-lg font-bold text-stone-900">定价与算力包</span>
              <span className="mt-2 flex-1 text-sm leading-relaxed text-stone-600">
                次数、权益与开通方式一览。
              </span>
              <span className="mt-4 text-sm font-semibold text-amber-950 transition group-hover:text-amber-900 group-hover:underline">
                前往 →
              </span>
            </ZhPricingLink>
          </div>
        </div>
      </div>
    </section>
  );
}
