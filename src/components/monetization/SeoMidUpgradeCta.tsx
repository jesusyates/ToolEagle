import { UpgradeLink } from "@/components/monetization/UpgradeLink";
import type { PseoLocale } from "@/lib/programmatic-seo";

/** V94: Mid-content CTA for SEO / programmatic templates · V104.1: softer `tone="pseo"` */
export function SeoMidUpgradeCta({
  locale = "en",
  tone = "default"
}: {
  locale?: PseoLocale;
  tone?: "default" | "pseo";
}) {
  const isZh = locale === "zh";
  const pseo = tone === "pseo";
  return (
    <aside className="my-10 rounded-2xl border-2 border-sky-300 bg-sky-50/90 p-5">
      <p className="text-sm font-bold text-slate-900">
        {isZh
          ? pseo
            ? "结构化创作 · 提升内容表现的方法"
            : "涨粉更快 · 爆款结构 · 直接可用文案"
          : pseo
            ? "Structured drafting — ToolEagle Pro"
            : "Get results faster with ToolEagle Pro"}
      </p>
      <p className="mt-1 text-sm text-slate-700">
        {isZh
          ? pseo
            ? "更高配额与模板化流程，便于稳定产出；请仍按平台规则与账号阶段自行调整。"
            : "提高完播率、强互动结构、转化型开头 — 算力包按次使用，适合日更创作者。"
          : pseo
            ? "Higher limits and repeatable workflows for publishing cadence. Adapt outputs to each platform’s rules."
            : "Save hours with AI — pay per use with credits, built for creators who publish daily."}
      </p>
      <UpgradeLink className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
        {isZh ? (pseo ? "查看方案 →" : "更快增长 — 查看次数包 →") : pseo ? "View plans →" : "Grow faster — view credit packs →"}
      </UpgradeLink>
    </aside>
  );
}
