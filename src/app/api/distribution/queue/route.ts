import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const HIGH_INTENT_PATTERNS = /赚钱|变现|monetiz|monetization|revenue|引流|yinliu/i;

function getPriority(item: { title?: string; slug?: string; page_type?: string }): "high" | "normal" {
  const text = `${item.title || ""} ${item.slug || ""}`;
  if (HIGH_INTENT_PATTERNS.test(text)) return "high";
  if (item.page_type === "en-how-to") return "high";
  return "normal";
}

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    const { data: items, error } = await supabase
      .from("distribution_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[distribution/queue]", error);
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    const queueIds = (items ?? []).map((i) => i.id).filter(Boolean);
    let postedByQueue: Record<string, string[]> = {};
    if (queueIds.length > 0) {
      try {
        const { data: posted } = await supabase
          .from("distribution_posts")
          .select("queue_id, platform")
          .eq("user_id", user.id)
          .in("queue_id", queueIds);
        for (const p of posted ?? []) {
          if (p.queue_id) {
            if (!postedByQueue[p.queue_id]) postedByQueue[p.queue_id] = [];
            postedByQueue[p.queue_id].push(p.platform);
          }
        }
      } catch {
        // queue_id column may not exist yet
      }
    }

    const withMeta = (items ?? []).map((item) => ({
      ...item,
      priority: getPriority(item),
      postedPlatforms: postedByQueue[item.id] ?? []
    }));

    withMeta.sort((a, b) => {
      if (a.priority === "high" && b.priority !== "high") return -1;
      if (a.priority !== "high" && b.priority === "high") return 1;
      return 0;
    });

    let outbound: unknown[] = [];
    try {
      const { data: ob } = await supabase
        .from("distribution_outbound_queue")
        .select("id, platform, content, status, created_at")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(50);
      outbound = ob ?? [];
    } catch {
      /* migration 0027 */
    }

    return NextResponse.json({ items: withMeta, outbound });
  } catch (e) {
    console.error("[distribution/queue]", e);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}

const OUT_PLATFORMS = ["reddit", "x", "quora"] as const;

/** V92: enqueue platform-specific draft (distribution_outbound_queue) */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const platform = body?.platform as string;
    const content = body?.content as string;

    if (!platform || !OUT_PLATFORMS.includes(platform as (typeof OUT_PLATFORMS)[number])) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }
    if (!content || typeof content !== "string" || content.length < 3) {
      return NextResponse.json({ error: "Invalid content" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("distribution_outbound_queue")
      .insert({
        user_id: user.id,
        platform,
        content: content.slice(0, 12000),
        status: "pending"
      })
      .select("id")
      .single();

    if (error) {
      if (error.message?.includes("relation") || error.code === "42P01") {
        return NextResponse.json({ error: "Outbound queue not migrated" }, { status: 503 });
      }
      console.error("[distribution/queue POST]", error);
      return NextResponse.json({ error: "Failed to enqueue" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (e) {
    console.error("[distribution/queue POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
