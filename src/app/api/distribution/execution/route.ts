import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** V83: Execution stats - today's count, streak, daily progress */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({
        todayByPlatform: { reddit: 0, x: 0, quora: 0 },
        streak: 0,
        totalPosts: 0
      });
    }

    const { data: posts } = await supabase
      .from("distribution_posts")
      .select("platform, post_created_at")
      .eq("user_id", user.id);

    const today = new Date().toISOString().slice(0, 10);
    const todayByPlatform = { reddit: 0, x: 0, quora: 0 };
    const datesWithPosts = new Set<string>();

    const validPlatforms = ["reddit", "x", "quora"] as const;
    for (const p of posts ?? []) {
      const date = p.post_created_at?.slice(0, 10);
      if (date) datesWithPosts.add(date);
      if (date === today && p.platform && validPlatforms.includes(p.platform as typeof validPlatforms[number])) {
        todayByPlatform[p.platform as keyof typeof todayByPlatform]++;
      }
    }

    let streak = 0;
    const todayStr = new Date().toISOString().slice(0, 10);
    let checkDate = new Date();
    for (let i = 0; i < 365; i++) {
      const checkStr = checkDate.toISOString().slice(0, 10);
      if (datesWithPosts.has(checkStr)) streak++;
      else if (i > 0) break;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return NextResponse.json({
      todayByPlatform,
      streak,
      totalPosts: posts?.length ?? 0
    });
  } catch (e) {
    console.error("[distribution/execution]", e);
    return NextResponse.json({
      todayByPlatform: { reddit: 0, x: 0, quora: 0 },
      streak: 0,
      totalPosts: 0
    });
  }
}
