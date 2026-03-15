import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Login required to share" }, { status: 401 });
  }

  const body = await req.json();
  const toolSlug = typeof body.toolSlug === "string" ? body.toolSlug.trim() : "";
  const toolName = typeof body.toolName === "string" ? body.toolName.trim() : "";
  const input = typeof body.input === "string" ? body.input.trim() : "";
  const result = typeof body.result === "string" ? body.result.trim() : "";

  if (!toolSlug || !toolName || !result) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (result.length > 2000) {
    return NextResponse.json({ error: "Result too long" }, { status: 400 });
  }

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();

    const keyword = input
      .slice(0, 100)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 30) || "example";
    const shortId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const slug = `${toolSlug}-${keyword}-${shortId}`;

    const { error } = await supabase.from("public_examples").insert({
      tool_slug: toolSlug,
      tool_name: toolName,
      input: input.slice(0, 500),
      result,
      creator_username: profile?.username ?? null,
      creator_id: user.id,
      source: "from_history",
      slug
    });

    if (error) {
      console.error("share-to-examples error:", error);
      return NextResponse.json({ error: "Failed to share" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("share-to-examples error:", err);
    return NextResponse.json({ error: "Failed to share" }, { status: 500 });
  }
}
