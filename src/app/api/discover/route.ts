import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const PAGE_SIZE = 24;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10) || 0);
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("public_examples")
    .select("slug, tool_name, tool_slug, result, creator_username, created_at")
    .not("slug", "is", null)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = (data ?? []).map((r) => ({
    slug: r.slug,
    toolName: r.tool_name,
    toolSlug: r.tool_slug,
    result: r.result,
    creatorUsername: r.creator_username,
    createdAt: r.created_at
  }));

  return NextResponse.json({
    items,
    hasMore: items.length === PAGE_SIZE
  });
}
