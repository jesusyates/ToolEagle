import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, platform, keyword } = body;

    if (!url || !platform || !keyword) {
      return NextResponse.json(
        { error: "Missing url, platform, or keyword" },
        { status: 400 }
      );
    }

    const validPlatforms = ["reddit", "x", "quora"];
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { error: "Invalid platform" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.from("backlinks").insert({
      url: String(url).slice(0, 500),
      platform,
      keyword: String(keyword).slice(0, 200)
    });

    if (error) {
      console.error("[backlinks] insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[backlinks]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
