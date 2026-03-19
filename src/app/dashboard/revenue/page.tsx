import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { getAffiliateTools } from "@/config/affiliate-tools";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Revenue Dashboard | ToolEagle",
  description: "联盟工具收入估算 - 点击量与预估收益"
};

const EARNINGS_PER_CLICK = 0.5;

export default async function RevenueDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/revenue");
  }

  const admin = createAdminClient();
  const { data: metrics } = await admin
    .from("zh_tool_metrics")
    .select("tool_id, views, clicks");

  const totalClicks = (metrics ?? []).reduce((sum, r) => sum + (r.clicks ?? 0), 0);
  const totalViews = (metrics ?? []).reduce((sum, r) => sum + (r.views ?? 0), 0);
  const estimatedEarnings = totalClicks * EARNINGS_PER_CLICK;
  const hasAffiliate = getAffiliateTools().length > 0;

  const toolStats = (metrics ?? []).map((r) => ({
    toolId: r.tool_id,
    views: r.views ?? 0,
    clicks: r.clicks ?? 0,
    ctr: (r.views ?? 0) > 0 ? ((r.clicks ?? 0) / (r.views ?? 0) * 100).toFixed(1) : "0"
  })).sort((a, b) => b.clicks - a.clicks);

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="container pt-10 pb-16">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <Link href="/dashboard" className="text-sm font-medium text-sky-600 hover:text-sky-800">
                  ← Dashboard
                </Link>
                <Link href="/dashboard/revenue/pages" className="text-sm font-medium text-sky-600 hover:text-sky-800">
                  📊 页面分析
                </Link>
              </div>
              <h1 className="text-2xl font-semibold text-slate-900 mt-2">
                💰 收入仪表盘
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                联盟工具点击量与预估收益（估算公式：点击 × $0.5）
              </p>
            </div>
          </div>

          {!hasAffiliate && (
            <div className="mt-6 rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
              <p className="font-medium text-amber-800">⚠️ 未配置联盟链接，当前无法产生收入</p>
              <p className="mt-1 text-sm text-slate-600">请在 Vercel 环境变量中配置 AFFILIATE_TOOL_1～5</p>
            </div>
          )}

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-medium text-slate-600">总点击量</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{totalClicks}</p>
            </div>
            <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-medium text-slate-600">总曝光量</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{totalViews}</p>
            </div>
            <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-6">
              <p className="text-sm font-medium text-amber-800">预估收益</p>
              <p className="mt-2 text-3xl font-bold text-amber-900">${estimatedEarnings.toFixed(2)}</p>
              <p className="mt-1 text-xs text-slate-600">clicks × ${EARNINGS_PER_CLICK}</p>
            </div>
          </div>

          {toolStats.length > 0 && (
            <div className="mt-10">
              <h2 className="text-lg font-semibold text-slate-900">各工具表现</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[400px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-3 px-4 text-left font-semibold text-slate-900">工具 ID</th>
                      <th className="py-3 px-4 text-right font-semibold text-slate-900">曝光</th>
                      <th className="py-3 px-4 text-right font-semibold text-slate-900">点击</th>
                      <th className="py-3 px-4 text-right font-semibold text-slate-900">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {toolStats.map((t) => (
                      <tr key={t.toolId} className="border-b border-slate-100">
                        <td className="py-3 px-4 font-medium text-slate-900">{t.toolId}</td>
                        <td className="py-3 px-4 text-right text-slate-600">{t.views}</td>
                        <td className="py-3 px-4 text-right text-slate-600">{t.clicks}</td>
                        <td className="py-3 px-4 text-right font-medium text-amber-600">{t.ctr}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
