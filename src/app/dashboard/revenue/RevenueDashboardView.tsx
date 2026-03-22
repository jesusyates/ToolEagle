import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { getAffiliateTools } from "@/config/affiliate-tools";
import { getShareContentForPage } from "@/lib/revenue-share-content";
import { getToolNameById, generateWhyThisWorks, inferIntent } from "@/lib/revenue-insights";
import { expandWinningKeywords, getInternalLinkStructure } from "@/lib/revenue-expansion";
import { getAllKeywordSlugsWithContent } from "@/lib/zh-keyword-content";
import { BoostPageButton } from "@/components/dashboard/BoostPageButton";
import { CloneSuccessButton } from "@/components/dashboard/CloneSuccessButton";
import { GenerateMorePagesButton } from "@/components/dashboard/GenerateMorePagesButton";
import { DailyRevenueReport } from "@/components/dashboard/DailyRevenueReport";
import { PseoHealthBlock } from "@/components/dashboard/PseoHealthBlock";

const EARNINGS_PER_CLICK = 0.5;

const BOOST_SUGGESTIONS_EN = [
  "Post this again",
  "Add 5 internal links",
  "Use stronger CTA"
];

const BOOST_SUGGESTIONS_ZH = ["再发一轮", "加 5 条内链", "加强行动号召（CTA）"];

function formatIntentLabel(raw: string, isZh: boolean): string {
  if (raw === "general") return isZh ? "综合/泛需求" : "General / mixed";
  return raw;
}

export async function RevenueDashboardView({ locale }: { locale: "en" | "zh" }) {
  const isZh = locale === "zh";
  const dash = isZh ? "/zh/dashboard" : "/dashboard";
  const revenuePagesHref = `${dash}/revenue/pages`;
  const boostSuggestions = isZh ? BOOST_SUGGESTIONS_ZH : BOOST_SUGGESTIONS_EN;
  const tx = (en: string, zh: string) => (isZh ? zh : en);

  const admin = createAdminClient();
  const { data: metrics } = await admin
    .from("zh_tool_metrics")
    .select("tool_id, views, clicks");

  const { data: pageRows } = await admin
    .from("zh_page_revenue_metrics")
    .select("page_slug, page_type, keyword, tool_id, views, clicks, estimated_revenue")
    .order("estimated_revenue", { ascending: false });

  const { data: analytics } = await admin
    .from("zh_analytics")
    .select("event_type, event_data")
    .in("event_type", ["tool_click", "page_view", "email_submit", "share_click"])
    .order("created_at", { ascending: false })
    .limit(5000);

  const totalClicks = (metrics ?? []).reduce((sum, r) => sum + (r.clicks ?? 0), 0);
  const totalViews = (metrics ?? []).reduce((sum, r) => sum + (r.views ?? 0), 0);
  const estimatedEarnings = totalClicks * EARNINGS_PER_CLICK;
  const hasAffiliate = getAffiliateTools().length > 0;

  const ctaVariantCounts = new Map<string, number>();
  const pageViewsBySlug = new Map<string, number>();
  const shareClickBySlug = new Map<string, number>();
  const emailByKeyword = new Map<string, number>();
  const toolClickByKeyword = new Map<string, number>();
  const toolClickByPage = new Map<string, number>();
  const toolClickByTool = new Map<string, number>();
  const toolViewByTool = new Map<string, number>();
  const toolPagesByTool = new Map<string, Set<string>>();

  for (const row of analytics ?? []) {
    const d = (row.event_data as Record<string, unknown>) ?? {};
    if (row.event_type === "tool_click") {
      const variant = d.cta_variant as string | undefined;
      ctaVariantCounts.set(variant || "(unknown)", (ctaVariantCounts.get(variant || "(unknown)") ?? 0) + 1);
      const slug = d.page_slug as string | undefined;
      const kw = d.keyword as string | undefined;
      const tid = d.tool_id as string | undefined;
      if (slug) {
        toolClickByPage.set(slug, (toolClickByPage.get(slug) ?? 0) + 1);
      }
      if (kw) {
        toolClickByKeyword.set(kw, (toolClickByKeyword.get(kw) ?? 0) + 1);
      }
      if (tid) {
        toolClickByTool.set(tid, (toolClickByTool.get(tid) ?? 0) + 1);
        if (slug) {
          const set = toolPagesByTool.get(tid) ?? new Set();
          set.add(slug);
          toolPagesByTool.set(tid, set);
        }
      }
    } else if (row.event_type === "page_view") {
      const slug = d.slug as string | undefined;
      if (slug) pageViewsBySlug.set(slug, (pageViewsBySlug.get(slug) ?? 0) + 1);
    } else if (row.event_type === "share_click") {
      const slug = d.slug as string | undefined;
      if (slug) shareClickBySlug.set(slug, (shareClickBySlug.get(slug) ?? 0) + 1);
    } else if (row.event_type === "email_submit") {
      const kw = d.keyword as string | undefined;
      if (kw) emailByKeyword.set(kw, (emailByKeyword.get(kw) ?? 0) + 1);
    }
  }

  for (const r of metrics ?? []) {
    toolViewByTool.set(r.tool_id ?? "", r.views ?? 0);
  }

  const topCtaVariants = [...ctaVariantCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const pageViews = [...pageViewsBySlug.values()].reduce((s, v) => s + v, 0);
  const emailSubmits = [...emailByKeyword.values()].reduce((s, v) => s + v, 0);
  const emailCaptureRate = pageViews > 0 ? ((emailSubmits / pageViews) * 100).toFixed(1) : "0";

  const byPage = new Map<string, { slug: string; keyword: string; pageType: string; views: number; clicks: number; revenue: number }>();
  const byTool = new Map<string, { toolId: string; views: number; clicks: number; revenue: number; pageCount: number }>();
  const byKeyword = new Map<string, { keyword: string; clicks: number; emails: number; revenue: number }>();

  const toolPageSet = new Map<string, Set<string>>();
  for (const r of pageRows ?? []) {
    const slug = r.page_slug ?? "";
    const cur = byPage.get(slug) ?? { slug, keyword: r.keyword ?? "", pageType: r.page_type ?? "keyword", views: 0, clicks: 0, revenue: 0 };
    cur.views += r.views ?? 0;
    cur.clicks += r.clicks ?? 0;
    cur.revenue += Number(r.estimated_revenue ?? 0);
    if (r.keyword && !cur.keyword) cur.keyword = r.keyword;
    byPage.set(slug, cur);

    const tId = r.tool_id ?? "";
    const tCur = byTool.get(tId) ?? { toolId: tId, views: 0, clicks: 0, revenue: 0, pageCount: 0 };
    tCur.views += r.views ?? 0;
    tCur.clicks += r.clicks ?? 0;
    tCur.revenue += Number(r.estimated_revenue ?? 0);
    const set = toolPageSet.get(tId) ?? new Set();
    set.add(slug);
    toolPageSet.set(tId, set);
    byTool.set(tId, tCur);
  }
  for (const [tId, tCur] of byTool) {
    tCur.pageCount = toolPageSet.get(tId)?.size ?? 0;
  }
  for (const r of pageRows ?? []) {
    const kw = r.keyword || "(无)";
    const kCur = byKeyword.get(kw) ?? { keyword: kw, clicks: 0, emails: 0, revenue: 0 };
    kCur.clicks += r.clicks ?? 0;
    kCur.revenue += Number(r.estimated_revenue ?? 0);
    kCur.emails = emailByKeyword.get(kw) ?? kCur.emails;
    byKeyword.set(kw, kCur);
  }

  const toolStats = (metrics ?? []).map((r) => ({
    toolId: r.tool_id,
    views: r.views ?? 0,
    clicks: r.clicks ?? 0,
    ctr: (r.views ?? 0) > 0 ? ((r.clicks ?? 0) / (r.views ?? 0) * 100).toFixed(1) : "0"
  }));

  const firstTool = toolStats.sort((a, b) => b.clicks - a.clicks)[0];
  const topPagesByClicks = [...byPage.values()].sort((a, b) => b.clicks - a.clicks);
  const firstPage = topPagesByClicks[0];
  const topKeywordsByClicks = [...byKeyword.values()].sort((a, b) => b.clicks - a.clicks);
  const firstKeyword = topKeywordsByClicks[0];

  const topMoneyPages = [...byPage.values()]
    .map((p) => ({
      ...p,
      ctr: p.views > 0 ? ((p.clicks / p.views) * 100).toFixed(1) : "0",
      emails: emailByKeyword.get(p.keyword) ?? 0
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  const toolRanking = [...byTool.values()].map((t) => ({
    ...t,
    ctr: t.views > 0 ? ((t.clicks / t.views) * 100).toFixed(1) : "0"
  }));
  const bestConvertingTool = [...toolRanking].sort((a, b) => parseFloat(b.ctr) - parseFloat(a.ctr))[0];
  const mostClickedTool = [...toolRanking].sort((a, b) => b.clicks - a.clicks)[0];

  const moneyKeywords = [...byKeyword.values()]
    .filter((k) => k.clicks > 0 || k.emails > 0)
    .sort((a, b) => b.clicks + b.emails - (a.clicks + a.emails))
    .slice(0, 10);

  const intentCounts = new Map<string, number>();
  for (const k of byKeyword.values()) {
    if (k.clicks > 0 || k.emails > 0) {
      const intent = inferIntent(k.keyword);
      intentCounts.set(intent, (intentCounts.get(intent) ?? 0) + k.clicks + k.emails);
    }
  }
  const bestIntent = [...intentCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "general";

  /** V88: Global view - revenue by country, top language */
  const revenueByCountry = new Map<string, { clicks: number; revenue: number }>();
  const topPagesByCountry = new Map<string, Array<{ slug: string; clicks: number }>>();
  for (const row of analytics ?? []) {
    if (row.event_type !== "tool_click") continue;
    const d = (row.event_data as Record<string, unknown>) ?? {};
    const country = (d.country as string) || "unknown";
    if (country === "unknown") continue;
    const cc = country.toUpperCase();
    const cur = revenueByCountry.get(cc) ?? { clicks: 0, revenue: 0 };
    cur.clicks += 1;
    cur.revenue += EARNINGS_PER_CLICK;
    revenueByCountry.set(cc, cur);
    const slug = (d.page_slug as string) || "";
    if (slug) {
      const arr = topPagesByCountry.get(cc) ?? [];
      const idx = arr.findIndex((x) => x.slug === slug);
      if (idx >= 0) arr[idx].clicks += 1;
      else arr.push({ slug, clicks: 1 });
      topPagesByCountry.set(cc, arr);
    }
  }
  const topCountries = [...revenueByCountry.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 10);
  for (const [, arr] of topPagesByCountry) {
    arr.sort((a, b) => b.clicks - a.clicks);
  }
  const revenueByLanguage = new Map<string, { clicks: number; revenue: number }>();
  for (const r of pageRows ?? []) {
    const pt = r.page_type ?? "other";
    const label = pt === "en-how-to" ? "EN" : pt === "zh-search" || pt === "keyword" ? "ZH" : pt;
    const cur = revenueByLanguage.get(label) ?? { clicks: 0, revenue: 0 };
    cur.clicks += r.clicks ?? 0;
    cur.revenue += Number(r.estimated_revenue ?? 0);
    revenueByLanguage.set(label, cur);
  }
  const topLanguages = [...revenueByLanguage.entries()].sort((a, b) => b[1].revenue - a[1].revenue);
  const pageTypeCounts = new Map<string, number>();
  for (const p of byPage.values()) {
    if (p.clicks > 0) {
      pageTypeCounts.set(p.pageType, (pageTypeCounts.get(p.pageType) ?? 0) + p.clicks);
    }
  }
  const bestPageType = [...pageTypeCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "keyword";

  const existingSlugs = new Set(getAllKeywordSlugsWithContent());
  const top3Keywords = topKeywordsByClicks.slice(0, 3).map((k) => k.keyword);
  const top3Pages = topPagesByClicks.slice(0, 3).map((p) => ({ slug: p.slug, keyword: p.keyword }));
  const top2Tools = toolRanking.slice(0, 2).map((t) => t.toolId);
  const { candidates: expansionCandidates } = expandWinningKeywords(top3Keywords, top3Pages, top2Tools, { maxTotal: 200 });
  const newCandidates = expansionCandidates.filter((c) => !existingSlugs.has(c.slug));
  const existingFromWinners = expansionCandidates.filter((c) => existingSlugs.has(c.slug));
  const winningTool = getAffiliateTools().find((t) => t.id === (mostClickedTool?.toolId ?? ""));
  const linkStructure = firstPage && winningTool
    ? getInternalLinkStructure(firstPage, winningTool.goSlug ?? "copy-ai", top3Pages)
    : null;

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      {!isZh ? <SiteHeader /> : null}

      <div className="flex-1">
        <section className="container pt-10 pb-16">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <Link href={dash} className="text-sm font-medium text-sky-600 hover:text-sky-800">
                  {tx("← Dashboard", "← 工作台")}
                </Link>
                <Link href={revenuePagesHref} className="text-sm font-medium text-sky-600 hover:text-sky-800">
                  📊 {tx("Page breakdown", "页面分析")}
                </Link>
              </div>
              <h1 className="text-2xl font-semibold text-slate-900 mt-2">
                💰 {tx("Revenue dashboard", "收入")}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {tx(
                  "Affiliate tool clicks and estimated earnings (simulated: clicks × $0.5).",
                  "联盟工具点击量与预估收益（模拟：点击 × $0.5）"
                )}
              </p>
            </div>
          </div>

          <div className="mt-8 max-w-4xl">
            <DailyRevenueReport locale={isZh ? "zh" : "en"} />
            <PseoHealthBlock locale={isZh ? "zh" : "en"} />
          </div>

          {!hasAffiliate && (
            <div className="mt-6 rounded-2xl border-2 border-sky-200 bg-sky-50 p-4">
              <p className="font-medium text-sky-800">
                {tx("Using curated tool links (Recommended by ToolEagle)", "使用精选联盟工具链接（ToolEagle 推荐）")}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {tx("Configure AFFILIATE_TOOL_1～5 for commission tracking", "配置 AFFILIATE_TOOL_1～5 以跟踪佣金")}
              </p>
            </div>
          )}

          {(firstTool || firstPage || firstKeyword) && (
            <div className="mt-8 rounded-2xl border-2 border-amber-400 bg-amber-50 p-6 ring-2 ring-amber-200">
              <h2 className="text-lg font-semibold text-amber-900 flex items-center gap-2">
                🔥 {tx("First revenue opportunity", "首要变现机会")}
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {firstTool && (
                  <div className="rounded-xl border border-amber-200 bg-white p-4">
                    <p className="text-xs font-medium text-amber-800">{tx("Best tool (most clicks)", "最佳工具（点击最多）")}</p>
                    <p className="mt-1 font-semibold text-slate-900">{getToolNameById(firstTool.toolId)}</p>
                    <p className="text-sm text-slate-600">
                      {firstTool.clicks} {tx("clicks", "次点击")} · {firstTool.ctr}% CTR
                    </p>
                  </div>
                )}
                {firstPage && (
                  <div className="rounded-xl border border-amber-200 bg-white p-4">
                    <p className="text-xs font-medium text-amber-800">{tx("Best page (most tool clicks)", "最佳页面（工具点击最多）")}</p>
                    <Link href={`/zh/search/${firstPage.slug}`} className="mt-1 block font-semibold text-sky-600 hover:underline truncate">
                      {firstPage.slug}
                    </Link>
                    <p className="text-sm text-slate-600">
                      {firstPage.clicks} {tx("clicks", "次点击")} ·{" "}
                      {firstPage.views > 0 ? ((firstPage.clicks / firstPage.views) * 100).toFixed(1) : "0"}% CTR · $
                      {firstPage.revenue.toFixed(2)}
                    </p>
                  </div>
                )}
                {firstKeyword && (
                  <div className="rounded-xl border border-amber-200 bg-white p-4">
                    <p className="text-xs font-medium text-amber-800">{tx("Best keyword (driving clicks)", "最佳关键词（带动点击）")}</p>
                    <p className="mt-1 font-semibold text-slate-900">{firstKeyword.keyword}</p>
                    <p className="text-sm text-slate-600">
                      {firstKeyword.clicks} {tx("clicks", "次点击")} · {firstKeyword.emails}{" "}
                      {tx("emails", "封邮件")}
                    </p>
                  </div>
                )}
              </div>
              {(firstTool || firstPage || firstKeyword) && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-white p-4">
                  <p className="text-xs font-medium text-amber-800">👉 {tx("Why this works", "为何有效")}</p>
                  <p className="mt-1 text-sm text-slate-700">
                    {generateWhyThisWorks(
                      firstTool ? getToolNameById(firstTool.toolId) : "",
                      firstPage?.slug ?? "",
                      firstKeyword?.keyword ?? "",
                      firstPage?.clicks ?? firstTool?.clicks ?? 0,
                      firstTool?.ctr ?? firstPage?.views ? ((firstPage.clicks / firstPage.views) * 100).toFixed(1) : "0"
                    )}
                  </p>
                </div>
              )}
              {firstPage && (
                <div className="mt-4">
                  <CloneSuccessButton keyword={firstPage.keyword} slug={firstPage.slug} />
                </div>
              )}
            </div>
          )}

          {expansionCandidates.length > 0 && (
            <div className="mt-8 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6">
              <h2 className="text-lg font-semibold text-emerald-900">{tx("Scaling in progress", "扩量进行中")}</h2>
              <p className="mt-2 text-sm text-slate-700">
                {tx("From winners:", "由爆款延伸：")}
                {existingFromWinners.length} {tx("pages exist ·", "页已存在 ·")} {newCandidates.length}{" "}
                {tx("new candidates", "个新候选")}
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-emerald-200 bg-white p-4">
                  <p className="text-xs font-medium text-emerald-800">{tx("New page candidates", "新页面候选")}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{newCandidates.length}</p>
                  <p className="text-xs text-slate-600">
                    {tx("Run: node scripts/revenue-expand.js --from-dashboard", "运行：node scripts/revenue-expand.js --from-dashboard")}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-white p-4">
                  <p className="text-xs font-medium text-emerald-800">{tx("Existing from expansion", "扩量已生成")}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{existingFromWinners.length}</p>
                  <p className="text-xs text-slate-600">{tx("Traffic → top money pages", "流量导向高变现页")}</p>
                </div>
              </div>
              {newCandidates.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-emerald-800">{tx("Sample new pages (first 8)", "新页示例（前 8 条）")}</p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {newCandidates.slice(0, 8).map((c) => (
                      <li key={c.slug}>
                        <Link href={`/zh/search/${c.slug}`} className="text-sky-600 hover:underline">
                          {c.keyword}
                        </Link>
                        <span className="text-slate-500"> → {c.slug}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {linkStructure && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-white p-4">
                  <p className="text-xs font-medium text-emerald-800">{tx("Internal link structure (new pages)", "内链结构（新页）")}</p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    <li>
                      {tx("Main money page:", "主变现页：")}
                      <Link href={linkStructure.mainPageLink} className="text-sky-600 hover:underline">
                        {linkStructure.mainPageLink}
                      </Link>
                    </li>
                    <li>
                      {tx("Top tool:", "主工具：")}
                      <Link href={linkStructure.topToolLink} className="text-sky-600 hover:underline">
                        {linkStructure.topToolLink}
                      </Link>
                    </li>
                    <li>
                      {tx("Related:", "相关页：")} {linkStructure.relatedLinks.length}
                    </li>
                  </ul>
                </div>
              )}
              {firstPage && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-white p-4">
                  <p className="text-xs font-medium text-emerald-800">{tx("Revenue cluster", "变现集群")}</p>
                  <p className="mt-1 text-sm text-slate-700">
                    {tx("Main:", "主词：")}
                    <Link href={`/zh/search/${firstPage.slug}`} className="text-sky-600 hover:underline">
                      {firstPage.keyword}
                    </Link>
                  </p>
                  <p className="text-xs text-slate-600">
                    {tx(
                      `Supporting: ${existingFromWinners.length} pages linking back · Add 10–20 more via expansion`,
                      `支撑页 ${existingFromWinners.length} 个回链 · 可再通过扩量增加 10–20 页`
                    )}
                  </p>
                </div>
              )}
              <p className="mt-4 text-xs text-emerald-800 font-medium">
                {tx(
                  "High priority distribution: top pages tagged for 5× share content",
                  "高优先级分发：头部页面已标记 5× 分享文案"
                )}
              </p>
            </div>
          )}

          {(pageViewsBySlug.size > 0 || shareClickBySlug.size > 0) && (
            <div className="mt-8 rounded-2xl border-2 border-indigo-200 bg-indigo-50 p-6">
              <h2 className="text-lg font-semibold text-indigo-900">📊 {tx("AI visibility (V89)", "AI 可见度（V89）")}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {tx(
                  "Pages by impressions (page_view) and distribution (share_click)",
                  "按曝光（page_view）与分发（share_click）"
                )}
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-indigo-200 bg-white p-4">
                  <p className="text-xs font-medium text-indigo-800">{tx("Top pages by impressions", "曝光最多的页")}</p>
                  <ul className="mt-2 space-y-1 text-sm max-h-32 overflow-y-auto">
                    {[...pageViewsBySlug.entries()]
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 8)
                      .map(([slug, n]) => (
                        <li key={slug} className="flex justify-between">
                          <span className="truncate">{slug}</span>
                          <span>{n}</span>
                        </li>
                      ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-indigo-200 bg-white p-4">
                  <p className="text-xs font-medium text-indigo-800">{tx("Top pages by share / distribution", "分发/分享最多的页")}</p>
                  <ul className="mt-2 space-y-1 text-sm max-h-32 overflow-y-auto">
                    {[...shareClickBySlug.entries()]
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 8)
                      .map(([slug, n]) => (
                        <li key={slug} className="flex justify-between">
                          <span className="truncate">{slug}</span>
                          <span>{n}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {(topCountries.length > 0 || topLanguages.length > 0) && (
            <div className="mt-8 rounded-2xl border-2 border-violet-200 bg-violet-50 p-6">
              <h2 className="text-lg font-semibold text-violet-900">🌍 {tx("Global view (V88)", "全球视角（V88）")}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {topCountries.length > 0 && (
                  <div className="rounded-xl border border-violet-200 bg-white p-4">
                    <p className="text-xs font-medium text-violet-800">{tx("Revenue by country", "按国家/地区")}</p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {topCountries.slice(0, 5).map(([cc, v]) => (
                        <li key={cc} className="flex justify-between">
                          <span>{cc}</span>
                          <span>${v.revenue.toFixed(2)} ({v.clicks} {tx("clicks", "次点击")})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {topLanguages.length > 0 && (
                  <div className="rounded-xl border border-violet-200 bg-white p-4">
                    <p className="text-xs font-medium text-violet-800">{tx("Top language performance", "语言维度表现")}</p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {topLanguages.slice(0, 5).map(([lang, v]) => (
                        <li key={lang} className="flex justify-between">
                          <span>{lang}</span>
                          <span>${v.revenue.toFixed(2)} ({v.clicks} {tx("clicks", "次点击")})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {topCountries.length > 0 && (
                  <div className="rounded-xl border border-violet-200 bg-white p-4">
                    <p className="text-xs font-medium text-violet-800">{tx("Top country pages", "各国头部页面")}</p>
                    <ul className="mt-2 space-y-1 text-sm max-h-32 overflow-y-auto">
                      {topCountries.slice(0, 3).flatMap(([cc]) => {
                        const pages = (topPagesByCountry.get(cc) ?? []).slice(0, 3);
                        return pages.map((p) => (
                          <li key={`${cc}-${p.slug}`} className="truncate">
                            <span className="text-violet-700">{cc}</span>: {p.slug} ({p.clicks})
                          </li>
                        ));
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {(firstTool || bestPageType || bestIntent) && (
            <div className="mt-8 rounded-2xl border-2 border-sky-200 bg-sky-50 p-6">
              <h2 className="text-lg font-semibold text-sky-900">{tx("What’s working right now", "当前有效打法")}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {firstTool && (
                  <div className="rounded-xl border border-sky-200 bg-white p-4">
                    <p className="text-xs font-medium text-sky-800">{tx("Best tool", "最佳工具")}</p>
                    <p className="mt-1 font-semibold text-slate-900">{getToolNameById(firstTool.toolId)}</p>
                  </div>
                )}
                <div className="rounded-xl border border-sky-200 bg-white p-4">
                  <p className="text-xs font-medium text-sky-800">{tx("Best page type", "最佳页面类型")}</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {bestPageType === "keyword"
                      ? tx("zh search", "中文搜索页")
                      : bestPageType === "guide"
                        ? tx("zh how-to", "中文教程")
                        : bestPageType}
                  </p>
                </div>
                <div className="rounded-xl border border-sky-200 bg-white p-4">
                  <p className="text-xs font-medium text-sky-800">{tx("Dominant search intent", "最终意图")}</p>
                  <p className="mt-1 font-semibold text-slate-900">{formatIntentLabel(bestIntent, isZh)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-medium text-slate-600">总点击量</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{totalClicks}</p>
            </div>
            <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-medium text-slate-600">总曝光量</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{totalViews}</p>
            </div>
            <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-6">
              <p className="text-sm font-medium text-amber-800">{tx("Estimated earnings (simulation)", "预估收益（模拟）")}</p>
              <p className="mt-2 text-3xl font-bold text-amber-900">${estimatedEarnings.toFixed(2)}</p>
              <p className="mt-1 text-xs text-slate-600">
                {tx("clicks ×", "点击 ×")} ${EARNINGS_PER_CLICK} · {tx("simulated", "模拟")}
              </p>
            </div>
            <div className="rounded-2xl border-2 border-sky-200 bg-sky-50 p-6">
              <p className="text-sm font-medium text-sky-800">{tx("Email capture rate", "邮件转化率")}</p>
              <p className="mt-2 text-3xl font-bold text-sky-900">{emailCaptureRate}%</p>
              <p className="mt-1 text-xs text-slate-600">
                {emailSubmits} {tx("submits /", "次提交 /")} {pageViews} {tx("views", "次曝光")}
              </p>
            </div>
          </div>

          {topMoneyPages.length > 0 && (
            <div className="mt-10">
              <h2 className="text-lg font-semibold text-slate-900">{tx("Top money pages", "高变现页面")}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {tx("Sorted by tool_click, email_submit, CTR", "按 tool_click、email_submit、CTR 排序")}
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[500px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-3 px-4 text-left font-semibold text-slate-900">{tx("Page", "页面")}</th>
                      <th className="py-3 px-4 text-left font-semibold text-slate-900">{tx("Keyword", "关键词")}</th>
                      <th className="py-3 px-4 text-right font-semibold text-slate-900">tool_click</th>
                      <th className="py-3 px-4 text-right font-semibold text-slate-900">email_submit</th>
                      <th className="py-3 px-4 text-right font-semibold text-slate-900">CTR</th>
                      <th className="py-3 px-4 text-right font-semibold text-slate-900">{tx("Revenue", "收益")}</th>
                      <th className="py-3 px-4 text-left font-semibold text-slate-900">
                        {tx("Boost · copy · distribution", "助推 · 复制 · 分发")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topMoneyPages.map((p) => {
                      const shareContent = getShareContentForPage(p.slug, p.keyword);
                      return (
                        <tr key={p.slug} className="border-b border-slate-100">
                          <td className="py-3 px-4">
                            <Link href={`/zh/search/${p.slug}`} className="font-medium text-sky-600 hover:underline truncate block max-w-[180px]">
                              {p.slug}
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-slate-600 truncate max-w-[120px]">{p.keyword}</td>
                          <td className="py-3 px-4 text-right font-medium text-amber-600">{p.clicks}</td>
                          <td className="py-3 px-4 text-right">{p.emails}</td>
                          <td className="py-3 px-4 text-right">{p.ctr}%</td>
                          <td className="py-3 px-4 text-right">${p.revenue.toFixed(2)}</td>
                          <td className="py-3 px-4">
                            <BoostPageButton slug={p.slug} keyword={p.keyword} shareContent={shareContent} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">{tx("Manual boost suggestions", "人工助推建议")}</h3>
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {boostSuggestions.map((s) => (
                    <li key={s}>• {s}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {toolRanking.length > 0 && (
            <div className="mt-10">
              <h2 className="text-lg font-semibold text-slate-900">{tx("Tool performance", "工具表现排行")}</h2>
              <p className="mt-1 text-sm text-slate-600">{tx("By clicks, CTR", "按点击、CTR")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {bestConvertingTool && (
                  <span className="rounded-full bg-amber-500 px-3 py-0.5 text-xs font-medium text-white">
                    🥇 {tx("Best converting:", "转化最佳：")}
                    {getToolNameById(bestConvertingTool.toolId)} ({bestConvertingTool.ctr}% CTR)
                  </span>
                )}
                {mostClickedTool && mostClickedTool.toolId !== bestConvertingTool?.toolId && (
                  <span className="rounded-full bg-sky-500 px-3 py-0.5 text-xs font-medium text-white">
                    🔥 {tx("Most clicked:", "点击最多：")}
                    {getToolNameById(mostClickedTool.toolId)} ({mostClickedTool.clicks} {tx("clicks", "次点击")})
                  </span>
                )}
                <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-0.5 text-xs font-medium text-amber-800">
                  👉 {tx("Use this tool more", "多推该工具")}
                </span>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[400px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-3 px-4 text-left font-semibold text-slate-900">{tx("Tool", "工具")}</th>
                      <th className="py-3 px-4 text-right font-semibold text-slate-900">{tx("Clicks", "点击")}</th>
                      <th className="py-3 px-4 text-right font-semibold text-slate-900">CTR</th>
                      <th className="py-3 px-4 text-right font-semibold text-slate-900">{tx("Pages", "页面数")}</th>
                      <th className="py-3 px-4 text-right font-semibold text-slate-900">{tx("Revenue", "收益")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {toolRanking.sort((a, b) => b.clicks - a.clicks).map((t) => (
                      <tr key={t.toolId} className="border-b border-slate-100">
                        <td className="py-3 px-4 font-medium text-slate-900">{getToolNameById(t.toolId)}</td>
                        <td className="py-3 px-4 text-right">{t.clicks}</td>
                        <td className="py-3 px-4 text-right font-medium text-amber-600">{t.ctr}%</td>
                        <td className="py-3 px-4 text-right">{t.pageCount}</td>
                        <td className="py-3 px-4 text-right">${t.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {moneyKeywords.length > 0 && (
            <div className="mt-10">
              <h2 className="text-lg font-semibold text-slate-900">{tx("Money keywords", "变现关键词")}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {tx("Top 10 by tool_click + email_submit", "按 tool_click + email_submit 前十")}
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[400px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-3 px-4 text-left font-semibold text-slate-900">{tx("Keyword", "关键词")}</th>
                      <th className="py-3 px-4 text-right font-semibold text-slate-900">{tx("Clicks", "点击")}</th>
                      <th className="py-3 px-4 text-right font-semibold text-slate-900">{tx("Conversion", "转化")}</th>
                      <th className="py-3 px-4 text-right font-semibold text-slate-900">{tx("Revenue", "收益")}</th>
                      <th className="py-3 px-4 text-left font-semibold text-slate-900">{tx("Action", "操作")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {moneyKeywords.map((k) => (
                      <tr key={k.keyword} className="border-b border-slate-100">
                        <td className="py-3 px-4 font-medium text-slate-900 truncate max-w-[180px]">{k.keyword}</td>
                        <td className="py-3 px-4 text-right text-amber-600">{k.clicks}</td>
                        <td className="py-3 px-4 text-right">
                          {k.emails} {tx("emails", "封邮件")}
                        </td>
                        <td className="py-3 px-4 text-right">${k.revenue.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <GenerateMorePagesButton keyword={k.keyword} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {topCtaVariants.length > 0 && (
            <div className="mt-10">
              <h2 className="text-lg font-semibold text-slate-900">{tx("Top CTA variants (by clicks)", "CTA 变体排行（按点击）")}</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[300px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-3 px-4 text-left font-semibold text-slate-900">{tx("CTA variant", "CTA 变体")}</th>
                      <th className="py-3 px-4 text-right font-semibold text-slate-900">{tx("Clicks", "点击")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCtaVariants.map(([variant, count]) => (
                      <tr key={variant} className="border-b border-slate-100">
                        <td className="py-3 px-4 font-medium text-slate-900">{variant}</td>
                        <td className="py-3 px-4 text-right text-amber-600">{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
                    {toolStats.sort((a, b) => b.clicks - a.clicks).map((t) => (
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

      {!isZh ? <SiteFooter /> : null}
    </main>
  );
}
