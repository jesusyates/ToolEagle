import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { SiteHeader } from "../../../_components/SiteHeader";
import { SiteFooter } from "../../../_components/SiteFooter";
import { getShareContentForPage } from "@/lib/revenue-share-content";
import { BoostPageButton } from "@/components/dashboard/BoostPageButton";

export async function RevenuePagesView({ locale }: { locale: "en" | "zh" }) {
  const isZh = locale === "zh";
  const dash = isZh ? "/zh/dashboard" : "/dashboard";
  const revenueHref = `${dash}/revenue`;
  const tx = (en: string, zh: string) => (isZh ? zh : en);

  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("zh_page_revenue_metrics")
    .select("page_slug, page_type, keyword, tool_id, views, clicks, estimated_revenue")
    .order("estimated_revenue", { ascending: false });

  const emptyKw = isZh ? "(无)" : "(none)";

  const byPage = new Map<
    string,
    { slug: string; type: string; keyword: string; views: number; clicks: number; revenue: number }
  >();
  const byTool = new Map<string, { toolId: string; views: number; clicks: number; revenue: number }>();
  const byKeyword = new Map<string, { keyword: string; views: number; clicks: number; revenue: number }>();

  for (const r of rows ?? []) {
    const slug = r.page_slug ?? "";
    const key = slug;
    const cur =
      byPage.get(key) ??
      { slug, type: r.page_type ?? "keyword", keyword: r.keyword ?? "", views: 0, clicks: 0, revenue: 0 };
    cur.views += r.views ?? 0;
    cur.clicks += r.clicks ?? 0;
    cur.revenue += Number(r.estimated_revenue ?? 0);
    if (r.keyword && !cur.keyword) cur.keyword = r.keyword;
    byPage.set(key, cur);

    const tId = r.tool_id ?? "";
    const tCur = byTool.get(tId) ?? { toolId: tId, views: 0, clicks: 0, revenue: 0 };
    tCur.views += r.views ?? 0;
    tCur.clicks += r.clicks ?? 0;
    tCur.revenue += Number(r.estimated_revenue ?? 0);
    byTool.set(tId, tCur);

    const kw = r.keyword || emptyKw;
    const kCur = byKeyword.get(kw) ?? { keyword: kw, views: 0, clicks: 0, revenue: 0 };
    kCur.views += r.views ?? 0;
    kCur.clicks += r.clicks ?? 0;
    kCur.revenue += Number(r.estimated_revenue ?? 0);
    byKeyword.set(kw, kCur);
  }

  const topMoneyPages = [...byPage.values()].sort((a, b) => b.clicks - a.clicks).slice(0, 10);
  const topByViews = [...byPage.values()].sort((a, b) => b.views - a.views).slice(0, 10);
  const topByClicks = [...byPage.values()].sort((a, b) => b.clicks - a.clicks).slice(0, 10);
  const topByRevenue = [...byPage.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  const topKeywords = [...byKeyword.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  const topTools = [...byTool.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      {!isZh ? <SiteHeader /> : null}

      <div className="flex-1">
        <section className="container pt-10 pb-16">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Link href={revenueHref} className="text-sm font-medium text-sky-600 hover:text-sky-800">
                {tx("← Revenue overview", "← 收入概览")}
              </Link>
              <h1 className="text-2xl font-semibold text-slate-900 mt-2">
                {tx("📊 Page-level revenue", "📊 页面级收入分析")}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {tx(
                  "Top pages, keywords, and tools by views, clicks, and estimated revenue.",
                  "按浏览、点击与预估收入查看高表现页面、关键词与工具。"
                )}
              </p>
            </div>
          </div>

          {topMoneyPages.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                {tx("Top money pages", "高转化页面")}
              </h2>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="py-3 px-4 text-left font-semibold">{tx("Page", "页面")}</th>
                      <th className="py-3 px-4 text-left font-semibold">{tx("Keyword", "关键词")}</th>
                      <th className="py-3 px-4 text-right font-semibold">{tx("Clicks", "点击")}</th>
                      <th className="py-3 px-4 text-right font-semibold">{tx("Revenue", "预估收入")}</th>
                      <th className="py-3 px-4 text-left font-semibold">{tx("Boost", "推广")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topMoneyPages.map((p) => {
                      const shareContent = getShareContentForPage(p.slug, p.keyword);
                      return (
                        <tr key={p.slug} className="border-b border-slate-100">
                          <td className="py-3 px-4">
                            <Link
                              href={`/zh/search/${p.slug}`}
                              className="text-sky-600 hover:underline truncate block max-w-[200px]"
                            >
                              {p.slug}
                            </Link>
                          </td>
                          <td className="py-3 px-4 truncate max-w-[150px]">{p.keyword}</td>
                          <td className="py-3 px-4 text-right">{p.clicks}</td>
                          <td className="py-3 px-4 text-right font-medium text-amber-600">
                            ${p.revenue.toFixed(2)}
                          </td>
                          <td className="py-3 px-4">
                            <BoostPageButton slug={p.slug} keyword={p.keyword} shareContent={shareContent} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                {tx("Top pages by revenue", "按收入排序的页面")}
              </h2>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="py-3 px-4 text-left font-semibold">{tx("Page", "页面")}</th>
                      <th className="py-3 px-4 text-right font-semibold">{tx("Views", "浏览")}</th>
                      <th className="py-3 px-4 text-right font-semibold">{tx("Clicks", "点击")}</th>
                      <th className="py-3 px-4 text-right font-semibold">{tx("Revenue", "预估收入")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topByRevenue.map((p) => (
                      <tr key={p.slug} className="border-b border-slate-100">
                        <td className="py-3 px-4">
                          <Link
                            href={`/zh/search/${p.slug}`}
                            className="text-sky-600 hover:underline truncate block max-w-[200px]"
                          >
                            {p.slug}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-right">{p.views}</td>
                        <td className="py-3 px-4 text-right">{p.clicks}</td>
                        <td className="py-3 px-4 text-right font-medium text-amber-600">${p.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                {tx("Top pages by clicks", "按点击排序的页面")}
              </h2>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="py-3 px-4 text-left font-semibold">{tx("Page", "页面")}</th>
                      <th className="py-3 px-4 text-right font-semibold">{tx("Clicks", "点击")}</th>
                      <th className="py-3 px-4 text-right font-semibold">{tx("Revenue", "预估收入")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topByClicks.map((p) => (
                      <tr key={p.slug} className="border-b border-slate-100">
                        <td className="py-3 px-4 truncate max-w-[200px]">{p.slug}</td>
                        <td className="py-3 px-4 text-right">{p.clicks}</td>
                        <td className="py-3 px-4 text-right">${p.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                {tx("Top converting keywords", "高转化关键词")}
              </h2>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="py-3 px-4 text-left font-semibold">{tx("Keyword", "关键词")}</th>
                      <th className="py-3 px-4 text-right font-semibold">{tx("Clicks", "点击")}</th>
                      <th className="py-3 px-4 text-right font-semibold">{tx("Revenue", "预估收入")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topKeywords.map((k) => (
                      <tr key={k.keyword} className="border-b border-slate-100">
                        <td className="py-3 px-4 truncate max-w-[200px]">{k.keyword}</td>
                        <td className="py-3 px-4 text-right">{k.clicks}</td>
                        <td className="py-3 px-4 text-right font-medium text-amber-600">${k.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                {tx("Top tools by revenue", "按收入排序的工具")}
              </h2>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="py-3 px-4 text-left font-semibold">{tx("Tool ID", "工具 ID")}</th>
                      <th className="py-3 px-4 text-right font-semibold">{tx("Clicks", "点击")}</th>
                      <th className="py-3 px-4 text-right font-semibold">{tx("Revenue", "预估收入")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topTools.map((t) => (
                      <tr key={t.toolId} className="border-b border-slate-100">
                        <td className="py-3 px-4">{t.toolId}</td>
                        <td className="py-3 px-4 text-right">{t.clicks}</td>
                        <td className="py-3 px-4 text-right font-medium text-amber-600">${t.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>

      {!isZh ? <SiteFooter /> : null}
    </main>
  );
}
