import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, keyword } = body;

    if (!platform || !keyword) {
      return NextResponse.json({ error: "Missing platform or keyword" }, { status: 400 });
    }

    if (!["reddit", "x", "quora"].includes(platform)) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase.from("distribution_posts").insert({
      user_id: user.id,
      platform,
      keyword: String(keyword).slice(0, 200)
    });

    if (error) {
      console.error("[distribution/post] Insert error:", error);
      return NextResponse.json({ error: "Failed to record" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[distribution/post] Error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
