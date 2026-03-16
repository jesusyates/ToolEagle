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
    const { type, title, content, topic, tags, tools } = body as {
      type?: string;
      title?: string;
      content?: string;
      topic?: string;
      tags?: string[];
      tools?: string[];
    };

    if (!type || !["prompt", "idea", "guide"].includes(type)) {
      return NextResponse.json({ error: "Invalid type. Must be prompt, idea, or guide." }, { status: 400 });
    }
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    let baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    if (!baseSlug) {
      return NextResponse.json({ error: "Title must contain letters or numbers" }, { status: 400 });
    }
    let slug = baseSlug;
    let suffix = 0;
    while (true) {
      const { data: existing } = await supabase
        .from("creator_posts")
        .select("id")
        .eq("type", type)
        .eq("slug", slug)
        .single();
      if (!existing) break;
      suffix++;
      slug = `${baseSlug}-${suffix}`;
    }

    let creatorId: string;

    const { data: existingCreator } = await supabase
      .from("creators")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existingCreator) {
      creatorId = existingCreator.id;
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, display_name, bio")
        .eq("id", user.id)
        .single();

      const username =
        profile?.username ??
        user.user_metadata?.username ??
        user.email?.split("@")[0]?.replace(/[^a-z0-9_-]/gi, "") ??
        `user-${user.id.slice(0, 8)}`;

      const baseUsername = username.toLowerCase().replace(/\s+/g, "");
      let finalUsername = baseUsername;
      let suffix = 0;
      while (true) {
        const { data: taken } = await supabase.from("creators").select("id").eq("username", finalUsername).single();
        if (!taken) break;
        suffix++;
        finalUsername = `${baseUsername}${suffix}`;
      }

      const { data: newCreator, error: createErr } = await supabase
        .from("creators")
        .insert({
          user_id: user.id,
          username: finalUsername,
          display_name: profile?.display_name ?? user.user_metadata?.full_name ?? user.user_metadata?.name ?? finalUsername,
          bio: profile?.bio ?? null
        })
        .select("id")
        .single();

      if (createErr) {
        console.error("[creator-posts] Create creator error:", createErr);
        return NextResponse.json({ error: createErr.message }, { status: 500 });
      }
      creatorId = newCreator!.id;
    }

    const { data: post, error: postErr } = await supabase
      .from("creator_posts")
      .insert({
        creator_id: creatorId,
        type,
        title: title.trim().slice(0, 200),
        content: content.trim(),
        topic: typeof topic === "string" && topic.trim() ? topic.trim().slice(0, 100) : null,
        slug,
        status: "draft",
        tags: Array.isArray(tags) ? tags.slice(0, 10).map((t) => String(t).slice(0, 50)) : [],
        tools: Array.isArray(tools) ? tools.slice(0, 10).map((t) => String(t).slice(0, 100)) : []
      })
      .select("id, slug, status, type, created_at")
      .single();

    if (postErr) {
      if (postErr.code === "23505") {
        return NextResponse.json({ error: "A post with this title already exists. Try a different title." }, { status: 409 });
      }
      console.error("[creator-posts] Create post error:", postErr);
      return NextResponse.json({ error: postErr.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      post: {
        id: post!.id,
        slug: post!.slug,
        status: post!.status,
        type: post!.type,
        created_at: post!.created_at,
        url: `/community/${type === "prompt" ? "prompts" : type === "idea" ? "ideas" : "guides"}/${post!.slug}`
      }
    });
  } catch (err) {
    console.error("[creator-posts] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
