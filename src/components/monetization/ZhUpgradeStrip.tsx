"use client";

import { ZhPricingLink } from "@/components/monetization/ZhPricingLink";
import { ZH_BRAND_TAGLINE } from "@/config/zh-brand";

/** V97.1 — Mid-page strip on /zh tools: Pro pitch without jumping straight to offshore checkout */
export function ZhUpgradeStrip() {
  return (
    <div className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 via-amber-50/90 to-white px-4 py-4 sm:px-5">
      <p className="text-sm font-semibold text-slate-900">{ZH_BRAND_TAGLINE}</p>
      <p className="mt-1 text-xs text-slate-600 leading-relaxed">
        免费档是<strong>精简预览</strong>；算力包解锁<strong>完整结构</strong>、更多变体与深度拆解——省掉反复改稿。
      </p>
      <ZhPricingLink
        conversionSource="tool_mid_cta_zh"
        className="mt-3 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      >
        查看定价与权益 →
      </ZhPricingLink>
    </div>
  );
}
