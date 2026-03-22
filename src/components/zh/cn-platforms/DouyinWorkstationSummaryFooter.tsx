import Link from "next/link";
import { ZH } from "@/lib/zh-site/paths";

/**
 * 抖音「涨粉 · 文案 · 转化」工作台说明 — 用于专栏页底部收束（站内闭环文案 + 链接）。
 */
export function DouyinWorkstationSummaryFooter() {
  return (
    <section
      className="rounded-2xl border border-red-100 bg-gradient-to-br from-red-50/50 via-white to-slate-50/80 p-6 md:p-8 shadow-sm"
      aria-labelledby="douyin-workstation-summary-footer"
    >
      <h2 id="douyin-workstation-summary-footer" className="text-lg font-bold tracking-tight text-slate-900 md:text-xl">
        抖音涨粉 · 爆款文案 · 转化工作台
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-700 md:text-[15px]">
        专注<strong>涨粉、爆款结构、评论/私信转化</strong>：示例与工具都按抖音语境写，不是「AI 写两句」演示。本页聚合{" "}
        <Link href={ZH.douyinHooksSeo} className="font-semibold text-red-800 hover:underline">
          钩子模板
        </Link>
        、
        <Link href={ZH.douyinCaptionExamplesSeo} className="font-semibold text-red-800 hover:underline">
          文案范例
        </Link>
        、
        <Link href={ZH.douyinScriptTemplatesSeo} className="font-semibold text-red-800 hover:underline">
          口播脚本库
        </Link>
        、
        <Link href={ZH.douyinTopicIdeasSeo} className="font-semibold text-red-800 hover:underline">
          选题灵感
        </Link>
        、
        <Link href={ZH.douyinContentIdeasSeo} className="font-semibold text-red-800 hover:underline">
          内容选题灵感
        </Link>
        、
        <Link href={ZH.douyinViralHooksLongTail} className="font-semibold text-red-800 hover:underline">
          爆款钩子灵感
        </Link>
        与六套生成器，链接全部在 <span className="whitespace-nowrap font-medium text-slate-800">/zh</span>{" "}
        站内完成闭环。
      </p>
    </section>
  );
}
