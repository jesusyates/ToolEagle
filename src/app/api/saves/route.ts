import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized", requireLogin: true }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("user_saves")
    .select("id, item_type, example_slug, tool_slug, tool_name, content, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ saves: data ?? [] });
}

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
  const { itemType, exampleSlug, toolSlug, toolName, content } = body;

  if (!itemType || !["caption", "hook", "example", "answer"].includes(itemType)) {
    return NextResponse.json({ error: "Invalid itemType" }, { status: 400 });
  }

  if (itemType === "answer") {
    const answerSlug = body.answerSlug;
    if (!answerSlug || !content) {
      return NextResponse.json({ error: "answerSlug and content required" }, { status: 400 });
    }
    const { data: existing } = await supabase
      .from("user_saves")
      .select("id")
      .eq("user_id", user.id)
      .eq("answer_slug", answerSlug)
      .single();
    if (existing) return NextResponse.json({ ok: true, saved: true, id: existing.id });
    const { data: inserted, error } = await supabase
      .from("user_saves")
      .insert({
        user_id: user.id,
        item_type: "answer",
        answer_slug: answerSlug,
        content
      })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, saved: true, id: inserted?.id });
  }

  if (itemType === "example") {
    if (!exampleSlug || !content) {
      return NextResponse.json({ error: "exampleSlug and content required" }, { status: 400 });
    }
    const { data: existing } = await supabase
      .from("user_saves")
      .select("id")
      .eq("user_id", user.id)
      .eq("example_slug", exampleSlug)
      .single();

    if (existing) return NextResponse.json({ ok: true, saved: true, id: existing.id });

    const { data: inserted, error } = await supabase
      .from("user_saves")
      .insert({
        user_id: user.id,
        item_type: "example",
        example_slug: exampleSlug,
        content
      })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, saved: true, id: inserted?.id });
  }

  if (!toolSlug || !toolName || !content) {
    return NextResponse.json({ error: "toolSlug, toolName, content required" }, { status: 400 });
  }

  const { data: inserted, error } = await supabase
    .from("user_saves")
    .insert({
      user_id: user.id,
      item_type: itemType,
      tool_slug: toolSlug,
      tool_name: toolName,
      content
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, saved: true, id: inserted?.id });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized", requireLogin: true }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const exampleSlug = searchParams.get("exampleSlug");
  const answerSlug = searchParams.get("answerSlug");

  if (id) {
    const { error } = await supabase
      .from("user_saves")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (exampleSlug) {
    const { error } = await supabase
      .from("user_saves")
      .delete()
      .eq("user_id", user.id)
      .eq("example_slug", exampleSlug);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (answerSlug) {
    const { error } = await supabase
      .from("user_saves")
      .delete()
      .eq("user_id", user.id)
      .eq("answer_slug", answerSlug);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "id, exampleSlug or answerSlug required" }, { status: 400 });
}
