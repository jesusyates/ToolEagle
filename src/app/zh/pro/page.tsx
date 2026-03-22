import Link from "next/link";
import { buildZhPageMetadata } from "@/lib/zh-site/seo";
import { ZH } from "@/lib/zh-site/paths";
import { ZH_BRAND_SUBLINE, ZH_BRAND_TAGLINE, zhSeoTitle } from "@/config/zh-brand";
import { Check } from "lucide-react";

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/pro",
  title: zhSeoTitle("Pro 算力 — 价值与场景"),
  description:
    `${ZH_BRAND_TAGLINE}。免费与付费对比、真实使用场景、你能拿到的结果。定价见定价页。`
});

export default function ZhProValuePage() {
  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <article className="flex-1 container max-w-3xl py-10 pb-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-red-800">Pro · 价值</p>
        <p className="mt-3 text-xl font-semibold text-slate-900 tracking-tight">{ZH_BRAND_TAGLINE}</p>
        <p className="mt-2 text-sm text-slate-600 whitespace-pre-line leading-relaxed">{ZH_BRAND_SUBLINE}</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-8">为什么付费：把时间花在「能发的结果」上</h1>
        <p className="mt-4 text-lg text-slate-600 leading-relaxed">
          免费档适合验证选题与结构；当你要<strong>日更、测多版开头、把转化写进描述区与评论引导</strong>时，算力包让你在<strong>有效期</strong>内按次使用完整生成能力，成本透明、可复盘。
        </p>

        <section className="mt-12">
          <h2 className="text-xl font-bold text-slate-900">免费 vs 付费（算力包）</h2>
          <div className="mt-4 grid sm:grid-cols-2 gap-4 text-sm">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
              <p className="font-bold text-slate-800 mb-3">免费</p>
              <ul className="space-y-2 text-slate-700">
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  每日有限次数，适合轻量试用
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  精简文案包与部分变体
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  先验证「这条选题值不值得拍」
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-red-200 bg-red-50/40 p-5">
              <p className="font-bold text-red-950 mb-3">付费 · 算力包</p>
              <ul className="space-y-2 text-slate-800">
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-red-700 shrink-0 mt-0.5" />
                  在有效期内按剩余次数生成，完整策略与更多变体
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-red-700 shrink-0 mt-0.5" />
                  可选「一键完整内容包」（单次消耗更多次数）
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 text-red-700 shrink-0 mt-0.5" />
                  适合高频创作与矩阵测试同一选题多版本
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-bold text-slate-900">典型使用场景</h2>
          <ul className="mt-4 space-y-3 text-slate-700 text-sm leading-relaxed list-disc list-inside">
            <li>
              <strong>同城/到店</strong>：同一服务拍多条，只改钩子与引导，测哪条私信多。
            </li>
            <li>
              <strong>带货测品</strong>：一次生成多组「卖点 + 证明 + 评论引导」，上线前选好两条再拍。
            </li>
            <li>
              <strong>知识口播</strong>：把「为什么能爆」和口播气口对齐，减少剪辑返工。
            </li>
          </ul>
        </section>

        <section className="mt-12 rounded-2xl border border-amber-200 bg-amber-50/50 p-6">
          <h2 className="text-xl font-bold text-amber-950">成果说明（你能依赖什么）</h2>
          <p className="mt-3 text-sm text-amber-950/90 leading-relaxed">
            我们提供<strong>结构化文案包与策略字段</strong>，帮你缩短从选题到可拍脚本的路径；不替代平台审核与投放结果。算力在<strong>有效期内按次扣减</strong>，可在工具内关闭「完整内容包」以节省次数。
          </p>
        </section>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link
            href={ZH.pricing}
            className="inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
          >
            查看套餐与价格 →
          </Link>
          <Link
            href={ZH.douyin}
            className="inline-flex rounded-xl border border-red-300 bg-white px-5 py-3 text-sm font-bold text-red-900 hover:bg-red-50"
          >
            抖音增长中心
          </Link>
        </div>
      </article>
    </main>
  );
}
