import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body as { status?: string };

    if (!status || !["draft", "published", "hidden"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const { data: post, error: fetchErr } = await supabase
      .from("creator_posts")
      .select("id, creator_id, type, slug")
      .eq("id", id)
      .single();

    if (fetchErr || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const { data: creator } = await supabase
      .from("creators")
      .select("user_id")
      .eq("id", post.creator_id)
      .single();

    if (!creator || creator.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: updateErr } = await supabase
      .from("creator_posts")
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    const typeRoute = post.type === "prompt" ? "prompts" : post.type === "idea" ? "ideas" : "guides";
    return NextResponse.json({
      ok: true,
      status,
      url: status === "published" ? `/community/${typeRoute}/${post.slug}` : null
    });
  } catch (err) {
    console.error("[creator-posts PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
