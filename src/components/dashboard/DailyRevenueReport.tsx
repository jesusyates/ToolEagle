"use client";

/**
 * V92: Daily revenue report panel (consumes /api/revenue/daily-report)
 */

import { useEffect, useState } from "react";

type TopPage = {
  slug: string;
  keyword: string;
  page_type: string;
  views: number;
  clicks: number;
  revenue: number;
  ctr: number;
  injection_weight: number;
};

type TopTool = { tool_id: string; name: string; views: number; clicks: number };
type TrafficSource = { source: string; events: number };

type Report = {
  generated_at: string;
  window: string;
  day: string;
  top_pages: TopPage[];
  top_tools: TopTool[];
  traffic_sources: TrafficSource[];
};

type Locale = "en" | "zh";

export function DailyRevenueReport({ locale = "en" }: { locale?: Locale }) {
  const isZh = locale === "zh";
  const t = {
    loading: isZh ? "正在加载每日简报…" : "Loading daily report…",
    title: isZh ? "每日收益简报（V92）" : "Daily revenue report (V92)",
    windowLabel: isZh ? "时间窗口" : "Window",
    topPages: isZh ? "高表现页面（点击、预估收益、CTR）" : "Top pages (clicks, revenue, CTR)",
    topTools: isZh ? "热门工具" : "Top tools",
    traffic: isZh ? "流量来源（近 24h）" : "Traffic sources (analytics 24h)",
    clk: isZh ? "点击" : "clk",
    clicks: isZh ? "次点击" : "clicks",
    views: isZh ? "次浏览" : "views"
  };
  const [data, setData] = useState<Report | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/revenue/daily-report", { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then(setData)
      .catch(() =>
        setErr(locale === "zh" ? "无法加载每日简报" : "Could not load daily report")
      );
  }, [locale]);

  if (err) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">{err}</div>
    );
  }
  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">{t.loading}</div>
    );
  }

  const localeTag = isZh ? "zh-CN" : undefined;

  return (
    <section className="rounded-2xl border-2 border-sky-200 bg-sky-50/40 p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">{t.title}</h2>
        <p className="text-xs text-slate-500 mt-1">
          {t.windowLabel}: {data.window} · {data.day} ·{" "}
          {new Date(data.generated_at).toLocaleString(localeTag)}
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-800">{t.topPages}</h3>
        <ul className="mt-2 space-y-1 text-sm max-h-48 overflow-y-auto">
          {data.top_pages.slice(0, 10).map((p) => (
            <li key={p.slug} className="flex flex-wrap justify-between gap-2 border-b border-sky-100 pb-1">
              <span className="text-slate-700 truncate max-w-[200px]">{p.keyword || p.slug}</span>
              <span className="text-slate-600 shrink-0">
                {t.clk} {p.clicks} · ${p.revenue} · CTR {p.ctr}% · w{p.injection_weight}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-800">{t.topTools}</h3>
        <ul className="mt-2 space-y-1 text-sm">
          {data.top_tools.slice(0, 8).map((tool) => (
            <li key={tool.tool_id} className="flex justify-between gap-2">
              <span className="text-slate-700 truncate">{tool.name}</span>
              <span className="text-slate-600 shrink-0">
                {tool.clicks} {t.clicks} · {tool.views} {t.views}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-800">{t.traffic}</h3>
        <ul className="mt-2 flex flex-wrap gap-2">
          {data.traffic_sources.map((s) => (
            <span
              key={s.source}
              className="rounded-full bg-white border border-sky-200 px-2.5 py-1 text-xs text-slate-700"
            >
              {s.source}: {s.events}
            </span>
          ))}
        </ul>
      </div>
    </section>
  );
}
