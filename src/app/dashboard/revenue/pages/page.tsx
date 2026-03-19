import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SiteHeader } from "../../../_components/SiteHeader";
import { SiteFooter } from "../../../_components/SiteFooter";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Revenue by Page | ToolEagle",
  description: "页面级收入分析 - 高转化页面与工具"
};

export default async function RevenuePagesDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/revenue/pages");
  }

  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("zh_page_revenue_metrics")
    .select("page_slug, page_type, keyword, tool_id, views, clicks, estimated_revenue")
    .order("estimated_revenue", { ascending: false });

  const byPage = new Map<
    string,
    { slug: string; type: string; keyword: string; views: number; clicks: number; revenue: number }
  >();
  const byTool = new Map<string, { toolId: string; views: number; clicks: number; revenue: number }>();
  const byKeyword = new Map<string, { keyword: string; views: number; clicks: number; revenue: number }>();

  for (const r of rows ?? []) {
    const slug = r.page_slug ?? "";
    const key = slug;
    const cur = byPage.get(key) ?? { slug, type: r.page_type ?? "keyword", keyword: r.keyword ?? "", views: 0, clicks: 0, revenue: 0 };
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

    const kw = r.keyword || "(无)";
    const kCur = byKeyword.get(kw) ?? { keyword: kw, views: 0, clicks: 0, revenue: 0 };
    kCur.views += r.views ?? 0;
    kCur.clicks += r.clicks ?? 0;
    kCur.revenue += Number(r.estimated_revenue ?? 0);
    byKeyword.set(kw, kCur);
  }

  const topByViews = [...byPage.values()].sort((a, b) => b.views - a.views).slice(0, 10);
  const topByClicks = [...byPage.values()].sort((a, b) => b.clicks - a.clicks).slice(0, 10);
  const topByRevenue = [...byPage.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  const topKeywords = [...byKeyword.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  const topTools = [...byTool.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="container pt-10 pb-16">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Link href="/dashboard/revenue" className="text-sm font-medium text-sky-600 hover:text-sky-800">
                ← 收入仪表盘
              </Link>
              <h1 className="text-2xl font-semibold text-slate-900 mt-2">
                📊 页面级收入分析
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Top pages, keywords, tools by views, clicks, revenue
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Top pages by revenue</h2>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="py-3 px-4 text-left font-semibold">Page</th>
                      <th className="py-3 px-4 text-right font-semibold">Views</th>
                      <th className="py-3 px-4 text-right font-semibold">Clicks</th>
                      <th className="py-3 px-4 text-right font-semibold">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topByRevenue.map((p) => (
                      <tr key={p.slug} className="border-b border-slate-100">
                        <td className="py-3 px-4">
                          <Link href={`/zh/search/${p.slug}`} className="text-sky-600 hover:underline truncate block max-w-[200px]">
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
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Top pages by clicks</h2>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="py-3 px-4 text-left font-semibold">Page</th>
                      <th className="py-3 px-4 text-right font-semibold">Clicks</th>
                      <th className="py-3 px-4 text-right font-semibold">Revenue</th>
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
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Top converting keywords</h2>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="py-3 px-4 text-left font-semibold">Keyword</th>
                      <th className="py-3 px-4 text-right font-semibold">Clicks</th>
                      <th className="py-3 px-4 text-right font-semibold">Revenue</th>
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
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Top tools by revenue</h2>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="py-3 px-4 text-left font-semibold">Tool ID</th>
                      <th className="py-3 px-4 text-right font-semibold">Clicks</th>
                      <th className="py-3 px-4 text-right font-semibold">Revenue</th>
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

      <SiteFooter />
    </main>
  );
}
