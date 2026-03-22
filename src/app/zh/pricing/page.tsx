import Link from "next/link";
import { FREE_DAILY_LIMIT } from "@/lib/usage";
import { Check } from "lucide-react";
import { hasPaymentLink } from "@/config/payment";
import { ZhProPaymentPanel } from "@/components/monetization/ZhProPaymentPanel";
import { PricingConversionTracker } from "@/components/pricing/PricingConversionTracker";
import { buildZhPageMetadata } from "@/lib/zh-site/seo";
import { ZH } from "@/lib/zh-site/paths";
import { ZH_BRAND_SUBLINE, ZH_BRAND_TAGLINE, zhSeoTitle } from "@/config/zh-brand";
import { listCreditPacksForUi } from "@/lib/credits/credit-packs";
import { ZhPricingSupportNote } from "@/components/zh/ZhPricingSupportNote";

export const metadata = buildZhPageMetadata({
  zhPath: "/zh/pricing",
  title: zhSeoTitle("定价 — 算力包与价格"),
  description: `${ZH_BRAND_TAGLINE}。套餐与价格：免费档与算力包；支付在本页完成。`
});

export default function ZhPricingPage() {
  const packs = listCreditPacksForUi();

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <PricingConversionTracker />

      <div className="flex-1">
        <section className="container pt-10 pb-8">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-800">定价</p>
            <p className="text-lg sm:text-xl font-semibold text-slate-900 mt-3 tracking-tight">{ZH_BRAND_TAGLINE}</p>
            <p className="text-slate-600 mt-2 text-sm whitespace-pre-line leading-relaxed">{ZH_BRAND_SUBLINE}</p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-6">套餐与价格</h1>
            <p className="text-slate-600 mt-3 text-sm">
              价值说明、场景与对比见{" "}
              <Link href={ZH.pro} className="text-red-800 font-bold underline">
                Pro 与价值
              </Link>
              。
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 max-w-5xl mx-auto">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-fit">
              <h2 className="text-lg font-semibold text-slate-900">免费</h2>
              <p className="mt-1 text-3xl font-bold text-slate-900">¥0</p>
              <p className="text-sm text-slate-600 mt-1">长期免费</p>
              <ul className="mt-6 space-y-3">
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  每日 {FREE_DAILY_LIMIT} 次生成额度
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  精简文案包
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  核心工具与结构库
                </li>
              </ul>
              <Link
                href={ZH.tiktokCaption}
                className="mt-6 inline-flex w-full justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                开始使用
              </Link>
            </div>

            <div
              id="cn-pro-highlight"
              className="rounded-2xl border-2 border-slate-900 bg-slate-50/30 p-6 shadow-sm relative ring-2 ring-amber-400/50"
            >
              <span className="absolute -top-3 left-4 rounded-full bg-amber-600 px-3 py-0.5 text-xs font-bold text-white">
                算力包
              </span>
              <h2 className="text-lg font-semibold text-slate-900">充值算力（微信 / 支付宝）</h2>
              <ul className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-200 pt-4">
                {packs.map((p) => (
                  <li key={p.id} className="flex justify-between gap-2">
                    <span className="font-medium text-slate-800">{p.labelZh}</span>
                    <span>
                      ¥{p.cny} · {p.credits} 次 · {p.days} 天
                    </span>
                  </li>
                ))}
              </ul>
              <ZhProPaymentPanel />
              {!hasPaymentLink() ? (
                <p className="mt-2 text-xs text-amber-800">
                  海外 Lemon 需 <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_PAYMENT_LINK</code>；国内需{" "}
                  <code className="rounded bg-amber-100 px-1">AGGREGATOR_*</code>。
                </p>
              ) : null}
            </div>
          </div>

          <ZhPricingSupportNote />
        </section>
      </div>

    </main>
  );
}
