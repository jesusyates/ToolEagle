import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ postsShared: 0, byPlatform: {} }, { status: 200 });
    }

    const { data: posts } = await supabase
      .from("distribution_posts")
      .select("platform")
      .eq("user_id", user.id);

    const byPlatform: Record<string, number> = { reddit: 0, x: 0, quora: 0 };
    for (const p of posts ?? []) {
      if (p.platform && byPlatform[p.platform] !== undefined) {
        byPlatform[p.platform]++;
      }
    }

    return NextResponse.json({
      postsShared: posts?.length ?? 0,
      byPlatform
    });
  } catch (e) {
    console.error("[distribution/stats]", e);
    return NextResponse.json({ postsShared: 0, byPlatform: {} }, { status: 200 });
  }
}
