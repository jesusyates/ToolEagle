import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cacheGet, cacheSet, cacheKey } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim().slice(0, 100) ?? "";

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const cacheKeyStr = cacheKey("search", q.toLowerCase());
  const cached = await cacheGet<{ results: unknown[] }>(cacheKeyStr);
  if (cached) return NextResponse.json(cached);

  try {
    const supabase = await createClient();
    const pattern = `%${q}%`;
    const { data } = await supabase
      .from("public_examples")
      .select("slug, tool_name, tool_slug, result, creator_username")
      .ilike("result", pattern)
      .not("slug", "is", null)
      .order("created_at", { ascending: false })
      .limit(20);

    const payload = { results: data ?? [] };
    await cacheSet(cacheKeyStr, payload);
    return NextResponse.json(payload);
  } catch (err) {
    console.error("search error:", err);
    return NextResponse.json({ results: [] });
  }
}
