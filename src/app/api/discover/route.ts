import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10) || 0);
    const sort = searchParams.get("sort") ?? "latest";
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const supabase = await createClient();
    let query = supabase
      .from("public_examples")
      .select("slug, tool_name, tool_slug, result, creator_username, created_at")
      .not("slug", "is", null);

    if (sort === "popular") {
      query = query.order("created_at", { ascending: false });
    } else if (sort === "trending") {
      query = query.order("created_at", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query.range(from, to);

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
  } catch (error) {
    console.error("[api/discover] API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
