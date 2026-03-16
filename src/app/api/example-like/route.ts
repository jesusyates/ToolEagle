import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized", requireLogin: true }, { status: 401 });
    }

    const body = await request.json();
    const { exampleSlug, action } = body;

    if (!exampleSlug || typeof exampleSlug !== "string") {
      return NextResponse.json({ error: "exampleSlug required" }, { status: 400 });
    }

    if (action === "like") {
      const { error } = await supabase.from("example_likes").upsert(
        { user_id: user.id, example_slug: exampleSlug },
        { onConflict: "user_id,example_slug" }
      );
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, liked: true });
    }

    if (action === "unlike") {
      const { error } = await supabase
        .from("example_likes")
        .delete()
        .eq("user_id", user.id)
        .eq("example_slug", exampleSlug);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, liked: false });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[api/example-like] API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    const { searchParams } = new URL(request.url);
    const exampleSlug = searchParams.get("exampleSlug");

    if (!exampleSlug) {
      return NextResponse.json({ liked: false, count: 0 });
    }

    const [likedRes, countRes] = await Promise.all([
      user
        ? supabase
            .from("example_likes")
            .select("id")
            .eq("user_id", user.id)
            .eq("example_slug", exampleSlug)
            .single()
        : { data: null },
      supabase
        .from("example_likes")
        .select("id", { count: "exact", head: true })
        .eq("example_slug", exampleSlug)
    ]);

    const count = countRes.count ?? 0;

    return NextResponse.json({
      liked: !!likedRes?.data,
      count
    });
  } catch (error) {
    console.error("[api/example-like] API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
