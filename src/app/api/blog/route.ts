import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized", requireLogin: true }, { status: 401 });
  }

  const body = await request.json();
  const {
    title,
    slug,
    content,
    description,
    status = "draft",
    category,
    tags = [],
    recommendedTools = []
  } = body;

  if (!title || !slug || !content) {
    return NextResponse.json(
      { error: "Missing required fields: title, slug, content" },
      { status: 400 }
    );
  }

  const slugClean = slug
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  if (!slugClean) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const authorName =
    user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? "Creator";

  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      title,
      slug: slugClean,
      content,
      description: description || title,
      author_id: user.id,
      author_name: authorName,
      status: status === "published" ? "published" : "draft",
      category: category || null,
      tags: Array.isArray(tags) ? tags : [],
      recommended_tools: Array.isArray(recommendedTools) ? recommendedTools : []
    })
    .select("id, slug, status, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, post: data });
}
