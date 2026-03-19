import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAffiliateTools, getPayoutPerClick } from "@/config/affiliate-tools";

const ALLOWED_EVENTS = ["tool_click", "tool_view", "email_submit", "page_view"] as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const eventType = body?.event_type;
    const eventData = body?.event_data ?? {};

    if (!eventType || !ALLOWED_EVENTS.includes(eventType)) {
      return NextResponse.json({ error: "Invalid event_type" }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.from("zh_analytics").insert({
      event_type: eventType,
      event_data: typeof eventData === "object" ? eventData : {}
    });

    if (error) {
      console.error("[zh/analytics] Insert error:", error);
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }

    const toolId = eventData?.tool_id;
    const pageSlug = eventData?.page_slug;
    const keyword = eventData?.keyword ?? null;
    const pageType = eventData?.page_type ?? "keyword";

    if ((eventType === "tool_view" || eventType === "tool_click") && toolId) {
      const admin = createAdminClient();
      await admin.rpc("increment_zh_tool_metric", {
        p_tool_id: String(toolId),
        p_type: eventType === "tool_view" ? "view" : "click"
      });

      // V70: Update zh_page_revenue_metrics when page_slug present
      if (pageSlug) {
        const tools = getAffiliateTools();
        const tool = tools.find((t) => t.id === toolId);
        const payout = tool ? getPayoutPerClick(tool) : 0.5;
        const viewDelta = eventType === "tool_view" ? 1 : 0;
        const clickDelta = eventType === "tool_click" ? 1 : 0;
        const revenueDelta = eventType === "tool_click" ? payout : 0;

        await admin.rpc("upsert_page_revenue_metric", {
          p_page_slug: String(pageSlug),
          p_page_type: pageType,
          p_keyword: keyword,
          p_tool_id: String(toolId),
          p_view_delta: viewDelta,
          p_click_delta: clickDelta,
          p_revenue_delta: revenueDelta
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[zh/analytics] Error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
