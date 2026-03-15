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
  const { toolSlug, toolName, text } = body;

  if (!toolSlug || !toolName || !text) {
    return NextResponse.json({ error: "Missing toolSlug, toolName, or text" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("text", text)
    .single();

  if (existing) {
    return NextResponse.json({ ok: true, saved: true });
  }

  const { error } = await supabase.from("favorites").insert({
    user_id: user.id,
    tool_slug: toolSlug,
    tool_name: toolName,
    text
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, saved: true });
}
