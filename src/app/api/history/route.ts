import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { resolveToolMarket } from "@/lib/tools/resolve-tool-market";

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

  const market = resolveToolMarket(toolSlug);

  const insertAttempt = await supabase.from("generation_history").insert({
    user_id: user.id,
    tool_slug: toolSlug,
    tool_name: toolName,
    input: input ?? "",
    items,
    market
  });

  if (insertAttempt.error) {
    // Backward compatibility: migration might not be applied yet.
    if (!insertAttempt.error.message?.includes("market")) {
      return NextResponse.json({ error: insertAttempt.error.message }, { status: 500 });
    }
    const fallback = await supabase.from("generation_history").insert({
      user_id: user.id,
      tool_slug: toolSlug,
      tool_name: toolName,
      input: input ?? "",
      items
    });
    if (fallback.error) {
      return NextResponse.json({ error: fallback.error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
