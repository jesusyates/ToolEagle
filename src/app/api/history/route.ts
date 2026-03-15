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
  const { toolSlug, toolName, input, items } = body;

  if (!toolSlug || !toolName || !Array.isArray(items)) {
    return NextResponse.json({ error: "Missing toolSlug, toolName, or items" }, { status: 400 });
  }

  const { error } = await supabase.from("generation_history").insert({
    user_id: user.id,
    tool_slug: toolSlug,
    tool_name: toolName,
    input: input ?? "",
    items
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
