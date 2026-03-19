import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const TOOL_SLUG_TO_KEYWORD: Record<string, string> = {
  "tiktok-caption-generator": "TikTok captions",
  "youtube-title-generator": "YouTube titles",
  "hook-generator": "viral hooks",
  "hashtag-generator": "hashtags",
  "title-generator": "video titles"
};

export async function GET() {
  try {
    const supabase = createAdminClient();

    const [revenueRes, usageRes] = await Promise.all([
      supabase
        .from("zh_page_revenue_metrics")
        .select("keyword, views, clicks")
        .not("keyword", "is", null)
        .limit(500),
      supabase
        .from("tool_usage_events")
        .select("tool_slug")
        .eq("event_type", "tool_generate")
        .limit(1000)
    ]);

    const revenueRows = revenueRes.data ?? [];
    const usageRows = usageRes.data ?? [];

    const keywordScores = new Map<string, { views: number; clicks: number; generates: number }>();

    for (const r of revenueRows) {
      const k = (r.keyword ?? "").trim();
      if (!k) continue;
      const cur = keywordScores.get(k) ?? { views: 0, clicks: 0, generates: 0 };
      cur.views += r.views ?? 0;
      cur.clicks += r.clicks ?? 0;
      keywordScores.set(k, cur);
    }

    for (const u of usageRows) {
      const slug = u.tool_slug ?? "";
      const k = TOOL_SLUG_TO_KEYWORD[slug] ?? slug.replace(/-/g, " ");
      if (!k) continue;
      const cur = keywordScores.get(k) ?? { views: 0, clicks: 0, generates: 0 };
      cur.generates += 1;
      keywordScores.set(k, cur);
    }

    const sorted = Array.from(keywordScores.entries())
      .map(([keyword, scores]) => ({
        keyword,
        ...scores,
        score: scores.clicks * 2 + scores.views + scores.generates
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    return NextResponse.json({ keywords: sorted });
  } catch (e) {
    console.error("[distribution/keywords] Error:", e);
    return NextResponse.json({ keywords: [] });
  }
}
