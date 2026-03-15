import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized", requireLogin: true }, { status: 401 });
  }

  const { data: collection, error: colErr } = await supabase
    .from("collections")
    .select("id, name, slug, created_at")
    .eq("user_id", user.id)
    .eq("slug", slug)
    .single();

  if (colErr || !collection) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  const { data: items } = await supabase
    .from("collection_items")
    .select("save_id")
    .eq("collection_id", collection.id)
    .order("created_at", { ascending: false });

  const saveIds = (items ?? []).map((i) => i.save_id).filter(Boolean);
  const saves =
    saveIds.length > 0
      ? (
          await supabase
            .from("user_saves")
            .select("id, item_type, example_slug, tool_slug, tool_name, content, created_at")
            .in("id", saveIds)
            .eq("user_id", user.id)
        ).data ?? []
      : [];

  const ordered = saveIds
    .map((id) => saves.find((s) => s.id === id))
    .filter(Boolean) as typeof saves;

  return NextResponse.json({ collection, items: ordered });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized", requireLogin: true }, { status: 401 });
  }

  const body = await request.json();
  const { saveId, action } = body;

  const { data: collection } = await supabase
    .from("collections")
    .select("id")
    .eq("user_id", user.id)
    .eq("slug", slug)
    .single();

  if (!collection) return NextResponse.json({ error: "Collection not found" }, { status: 404 });

  if (action === "add" && saveId) {
    const { error } = await supabase.from("collection_items").insert({
      collection_id: collection.id,
      save_id: saveId
    });
    if (error && error.code !== "23505") return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "remove" && saveId) {
    const { error } = await supabase
      .from("collection_items")
      .delete()
      .eq("collection_id", collection.id)
      .eq("save_id", saveId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
