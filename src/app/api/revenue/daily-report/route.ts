/**
 * V92: Daily revenue report — top pages, tools, traffic sources (last 24h + rollup).
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isOperatorUser } from "@/lib/auth/operator";
import { getToolNameById } from "@/lib/revenue-insights";

export const dynamic = "force-dynamic";

const DAY_MS = 86400000;

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isOperatorUser(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = createAdminClient();
    const since = new Date(Date.now() - DAY_MS).toISOString();
    const dayStart = new Date().toISOString().slice(0, 10);

    const [{ data: pageRows }, { data: toolRows }, { data: analytics }] = await Promise.all([
      admin
        .from("zh_page_revenue_metrics")
        .select("page_slug, page_type, keyword, tool_id, views, clicks, estimated_revenue")
        .order("estimated_revenue", { ascending: false })
        .limit(200),
      admin.from("zh_tool_metrics").select("tool_id, views, clicks").limit(200),
      admin
        .from("zh_analytics")
        .select("event_type, event_data, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(8000)
    ]);

    const pageAgg = new Map<
      string,
      { slug: string; keyword: string; page_type: string; views: number; clicks: number; revenue: number }
    >();
    for (const r of pageRows ?? []) {
      const slug = (r.page_slug as string) ?? "";
      if (!slug) continue;
      const cur =
        pageAgg.get(slug) ?? {
          slug,
          keyword: (r.keyword as string) || slug,
          page_type: (r.page_type as string) || "keyword",
          views: 0,
          clicks: 0,
          revenue: 0
        };
      cur.views += Number(r.views ?? 0);
      cur.clicks += Number(r.clicks ?? 0);
      cur.revenue += Number(r.estimated_revenue ?? 0);
      pageAgg.set(slug, cur);
    }

    const weightBySlug = new Map<string, number>();
    const wres = await admin.from("zh_page_revenue_metrics").select("page_slug, injection_weight").limit(500);
    if (!wres.error && wres.data) {
      for (const w of wres.data) {
        const s = (w.page_slug as string) || "";
        if (!s) continue;
        const iw = Number((w as { injection_weight?: number }).injection_weight ?? 1) || 1;
        weightBySlug.set(s, Math.max(weightBySlug.get(s) ?? 0, iw));
      }
    }

    const top_pages = [...pageAgg.values()]
      .map((p) => {
        const ctr = p.views > 0 ? (p.clicks / p.views) * 100 : 0;
        return {
          slug: p.slug,
          keyword: p.keyword,
          page_type: p.page_type,
          views: p.views,
          clicks: p.clicks,
          revenue: Math.round(p.revenue * 100) / 100,
          ctr: Math.round(ctr * 100) / 100,
          injection_weight: weightBySlug.get(p.slug) ?? 1
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 15);

    const toolAgg = new Map<string, { tool_id: string; views: number; clicks: number }>();
    for (const r of toolRows ?? []) {
      const id = (r.tool_id as string) || "";
      if (!id) continue;
      const cur = toolAgg.get(id) ?? { tool_id: id, views: 0, clicks: 0 };
      cur.views += Number(r.views ?? 0);
      cur.clicks += Number(r.clicks ?? 0);
      toolAgg.set(id, cur);
    }
    const top_tools = [...toolAgg.values()]
      .map((t) => ({
        tool_id: t.tool_id,
        name: getToolNameById(t.tool_id) || t.tool_id,
        views: t.views,
        clicks: t.clicks
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 15);

    const traffic_sources = new Map<string, number>();
    for (const row of analytics ?? []) {
      const d = (row.event_data as Record<string, unknown>) ?? {};
      const src =
        (d.source as string) ||
        (d.page_slug ? "content" : null) ||
        (row.event_type === "tool_click" || row.event_type === "tool_view" ? "tool" : null) ||
        (row.event_type === "page_view" ? "content" : null) ||
        "other";
      traffic_sources.set(src, (traffic_sources.get(src) ?? 0) + 1);
    }

    try {
      const { data: te } = await admin.from("traffic_events").select("source").gte("created_at", since).limit(5000);
      for (const e of te ?? []) {
        const s = (e.source as string) || "unknown";
        traffic_sources.set(`te:${s}`, (traffic_sources.get(`te:${s}`) ?? 0) + 1);
      }
    } catch {
      /* table may not exist until migration 0027 applied */
    }

    return NextResponse.json({
      generated_at: new Date().toISOString(),
      window: "24h",
      day: dayStart,
      top_pages,
      top_tools,
      traffic_sources: [...traffic_sources.entries()].map(([source, events]) => ({ source, events }))
    });
  } catch (e) {
    console.error("[revenue/daily-report]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
