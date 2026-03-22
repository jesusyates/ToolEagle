import { createAdminClient } from "@/lib/supabase/admin";
import { getPseoHealthSnapshot, DEFAULT_INDEX_THRESHOLDS } from "@/lib/programmatic-seo";

/**
 * V93.1: Compact pseo health strip on revenue dashboard (no standalone page).
 */
export async function PseoHealthBlock({ locale = "en" }: { locale?: "en" | "zh" }) {
  const isZh = locale === "zh";
  try {
    const admin = createAdminClient();
    const h = await getPseoHealthSnapshot(admin, DEFAULT_INDEX_THRESHOLDS);
    return (
      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
        <p className="font-semibold text-slate-900">
          {isZh ? "程序化 SEO（pSEO）健康度" : "Programmatic SEO (pseo) health"}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {isZh ? (
            <>
              阈值：预估收益 ≥ {DEFAULT_INDEX_THRESHOLDS.minRevenueScore}，质量分 ≥{" "}
              {DEFAULT_INDEX_THRESHOLDS.minQualityScore}，审核通过，且未列入黑名单
            </>
          ) : (
            <>
              Thresholds: revenue ≥ {DEFAULT_INDEX_THRESHOLDS.minRevenueScore}, quality ≥{" "}
              {DEFAULT_INDEX_THRESHOLDS.minQualityScore}, review = approved, not blacklisted
            </>
          )}
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
          <div>
            <dt className="text-slate-500">{isZh ? "SEO 关键词数" : "SEO keywords"}</dt>
            <dd className="font-medium text-slate-900">{h.seoKeywordCount}</dd>
          </div>
          <div>
            <dt className="text-slate-500">{isZh ? "程序化页面数" : "Programmatic pages"}</dt>
            <dd className="font-medium text-slate-900">{h.programmaticPageCount}</dd>
          </div>
          <div>
            <dt className="text-slate-500">{isZh ? "可入站地图索引" : "Indexable in sitemap"}</dt>
            <dd className="font-medium text-emerald-700">{h.indexableProgrammaticCount}</dd>
          </div>
          <div>
            <dt className="text-slate-500">{isZh ? "已过滤" : "Filtered out"}</dt>
            <dd className="font-medium text-amber-800">{h.filteredProgrammaticCount}</dd>
          </div>
          <div>
            <dt className="text-slate-500">{isZh ? "低分关键词*" : "Low score keywords*"}</dt>
            <dd className="font-medium text-slate-900">{h.lowQualityKeywordCount}</dd>
          </div>
          <div>
            <dt className="text-slate-500">{isZh ? "黑名单 / 待审核" : "Blacklisted / pending"}</dt>
            <dd className="font-medium text-slate-900">
              {h.blacklistedKeywordCount} / {h.pendingReviewKeywordCount}
            </dd>
          </div>
        </dl>
        <p className="mt-2 text-[11px] text-slate-400">
          {isZh ? (
            <>
              *质量分或预估收益低于阈值的关键词（近似信号）。
            </>
          ) : (
            <>
              *Keywords with quality &lt; threshold or revenue &lt; threshold (approximate signal).
            </>
          )}
        </p>
      </div>
    );
  } catch {
    return (
      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        {isZh
          ? "无法读取 pSEO 健康度（请检查 Supabase 迁移 0028 / 0029）。"
          : "PSEO health unavailable (check Supabase migrations 0028 / 0029)."}
      </div>
    );
  }
}
