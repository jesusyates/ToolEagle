import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, platform } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const validPlatforms = ["reddit", "x", "quora"];
    const platformToUse = validPlatforms.includes(platform) ? platform : "reddit";

    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: queueItem } = await supabase
      .from("distribution_queue")
      .select("title, slug")
      .eq("id", id)
      .single();

    if (queueItem) {
      await supabase.from("distribution_posts").insert({
        user_id: user.id,
        platform: platformToUse,
        keyword: queueItem.title || queueItem.slug,
        queue_id: id
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[distribution/queue/mark-posted]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
