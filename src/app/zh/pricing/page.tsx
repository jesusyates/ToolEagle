import Link from "next/link";
import { isCnAggregatorConfigured } from "@/lib/payment/cn-server";
import { ZhProPaymentPanel } from "@/components/monetization/ZhProPaymentPanel";
import { PricingConversionTracker } from "@/components/pricing/PricingConversionTracker";
import { buildZhPageMetadata } from "@/lib/zh-site/seo";
import { zhSeoTitle } from "@/config/zh-brand";
import { ZhPricingSupportNote } from "@/components/zh/ZhPricingSupportNote";
import { FREE_DAILY_LIMIT } from "@/lib/usage";

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/pricing",
  title: zhSeoTitle("定价 — 算力包与价格"),
  description: "购买创作次数。生成完整内容，按使用次数付费。"
});

export default function ZhPricingPage() {
  const cnReady = isCnAggregatorConfigured();

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <PricingConversionTracker />

      <div className="flex-1">
        <section className="container pt-10 pb-12">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-800">定价</p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-1">购买创作次数</h1>
            <p className="text-slate-600 mt-3 text-sm">生成完整内容，按使用次数付费</p>
          </div>

          <div className="max-w-6xl mx-auto grid gap-6 lg:grid-cols-[0.95fr_1.35fr] items-stretch">
            <div className="space-y-6 flex flex-col h-full">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">为什么选择次数包</h2>
                <ul className="mt-4 space-y-3 text-sm text-slate-700 leading-relaxed">
                  <li>按生成复杂度扣除次数，成本和使用量完全对应。</li>
                  <li>高质量或完整内容包会消耗更多次数，普通生成消耗更低。</li>
                  <li>
                    工具页顶部与{" "}
                    <Link href="/zh/dashboard/billing" className="font-semibold text-red-800 underline">
                      账单页
                    </Link>{" "}
                    可查看剩余次数和使用记录。
                  </li>
                </ul>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-6 shadow-sm mt-auto">
                <h3 className="text-base font-semibold text-slate-900">免费版说明（先对比）</h3>
                <p className="mt-2 text-sm text-slate-600">
                  不充值也能用基础能力；充值后可提升完整度与连续创作效率。
                </p>
                <p className="mt-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                  每天免费 {FREE_DAILY_LIMIT} 次
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  <li>• 适合偶尔使用、轻量需求</li>
                  <li>• 生成深度与次数相对有限</li>
                  <li>• 需要持续产出时建议升级次数包</li>
                </ul>
                <Link
                  href="/zh/tiktok-caption-generator"
                  className="mt-4 inline-flex w-full justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  继续免费试用
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm h-full flex flex-col">
              {!cnReady ? (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  暂未配置微信/支付宝聚合支付，当前可先查看套餐；完成配置后可立即支付。
                </div>
              ) : null}
              <div className="flex-1">
                <ZhProPaymentPanel paymentEnabled={cnReady} />
              </div>
            </div>
          </div>

          <ZhPricingSupportNote />
        </section>
      </div>

    </main>
  );
}
