import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim().slice(0, 100) ?? "";

  if (!q) {
    return NextResponse.json({ results: [] });
  }

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

    return NextResponse.json({ results: data ?? [] });
  } catch (err) {
    console.error("search error:", err);
    return NextResponse.json({ results: [] });
  }
}
