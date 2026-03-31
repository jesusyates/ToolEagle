import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { resolveToolMarket } from "@/lib/tools/resolve-tool-market";

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
    const { toolSlug, toolName, text } = body;

    if (!toolSlug || !toolName || !text) {
      return NextResponse.json({ error: "Missing toolSlug, toolName, or text" }, { status: 400 });
    }

    const market = resolveToolMarket(toolSlug);
    const existingAttempt = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("text", text)
      .eq("market", market)
      .single();

    const existing =
      existingAttempt.data ??
      // Backward compatibility: in case the migration hasn't been applied yet.
      (existingAttempt.error?.message?.includes("market")
        ? (
            await supabase
              .from("favorites")
              .select("id")
              .eq("user_id", user.id)
              .eq("text", text)
              .single()
          ).data
        : null);

    if (existing) {
      return NextResponse.json({ ok: true, saved: true });
    }

    const insertAttempt = await supabase.from("favorites").insert({
      user_id: user.id,
      tool_slug: toolSlug,
      tool_name: toolName,
      text,
      market
    });

    if (insertAttempt.error) {
      if (!insertAttempt.error.message?.includes("market")) {
        return NextResponse.json({ error: insertAttempt.error.message }, { status: 500 });
      }
      const fallback = await supabase.from("favorites").insert({
        user_id: user.id,
        tool_slug: toolSlug,
        tool_name: toolName,
        text
      });
      if (fallback.error) {
        return NextResponse.json({ error: fallback.error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, saved: true });
  } catch (error) {
    console.error("[api/favorites] API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
