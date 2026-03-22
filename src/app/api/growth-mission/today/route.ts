/**
 * V91: Today's Growth Mission - auto-selected tasks from top money pages
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getShareContentForPage } from "@/lib/revenue-share-content";
import { getAllEnHowToSlugs, getEnHowToContent } from "@/lib/en-how-to-content";
import { getKeywordContent } from "@/lib/zh-keyword-content";
import { getLatestKeywordPages } from "@/lib/zh-keyword-data";
import { BASE_URL } from "@/config/site";

export const dynamic = "force-dynamic";

type MissionTask = {
  id: string;
  slug: string;
  title: string;
  oneLiner: string;
  pageUrl: string;
  platform: "reddit" | "x" | "quora" | "boost";
  redditTitle?: string;
  redditBody?: string;
  xThread?: string;
  quoraAnswer?: string;
};

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 3) + "...";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") ?? "en";
    const zhOnlyTasks = locale === "zh";

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ tasks: [], todayByPlatform: { reddit: 0, x: 0, quora: 0 }, streak: 0 });
    }

    const admin = createAdminClient();
    const today = new Date().toISOString().slice(0, 10);

    const [pageRowsRes, postsData] = await Promise.all([
      admin.from("zh_page_revenue_metrics").select("page_slug, page_type, keyword, estimated_revenue").order("estimated_revenue", { ascending: false }).limit(20),
      supabase.from("distribution_posts").select("platform, post_created_at").eq("user_id", user.id)
    ]);

    const revenueRows = pageRowsRes.data ?? [];
    const posts = postsData.data ?? [];
    const todayByPlatform = { reddit: 0, x: 0, quora: 0 };
    const datesWithPosts = new Set<string>();
    for (const p of posts) {
      const date = (p.post_created_at as string)?.slice(0, 10);
      if (date) datesWithPosts.add(date);
      if (date === today && p.platform && p.platform in todayByPlatform) {
        todayByPlatform[p.platform as keyof typeof todayByPlatform]++;
      }
    }
    let streak = 0;
    let checkDate = new Date();
    for (let i = 0; i < 365; i++) {
      const checkStr = checkDate.toISOString().slice(0, 10);
      if (datesWithPosts.has(checkStr)) streak++;
      else break;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    const topSlugs = [...new Set(revenueRows.map((r) => r.page_slug).filter(Boolean))].slice(0, 12);
    const zhKeywords = getLatestKeywordPages(15);
    const enSlugs = getAllEnHowToSlugs().slice(0, 10);

    const tasks: MissionTask[] = [];
    const used = new Set<string>();

    function addTask(slug: string, pageType: string, keyword: string, title: string, oneLiner: string, pageUrl: string) {
      if (used.has(slug)) return;
      used.add(slug);
      const share = getShareContentForPage(slug, keyword);
      const redditBody = `Sharing a method I've been using (via ToolEagle):\n\n${oneLiner}\n\nFull guide: ${pageUrl}`;
      const redditTitle = truncate(title, 300);
      tasks.push({
        id: `${slug}-${tasks.length}`,
        slug,
        title,
        oneLiner,
        pageUrl,
        platform: "reddit",
        redditTitle,
        redditBody: `${redditTitle}\n\n${redditBody}`,
        xThread: share.xThread,
        quoraAnswer: share.quora
      });
    }

    for (const slug of topSlugs) {
      const content = getKeywordContent(slug);
      const title = content?.h1 || content?.title || slug;
      const oneLiner = content?.directAnswer || content?.description || "";
      const pageUrl = `${BASE_URL}/zh/search/${slug}`;
      addTask(slug, "zh-search", slug, title, oneLiner, pageUrl);
    }
    for (const k of zhKeywords) {
      if (tasks.length >= 12) break;
      const content = getKeywordContent(k.slug);
      const title = content?.h1 || content?.title || k.keyword;
      const oneLiner = content?.directAnswer || content?.description || "";
      const pageUrl = `${BASE_URL}/zh/search/${k.slug}`;
      addTask(k.slug, "zh-search", k.keyword, title, oneLiner, pageUrl);
    }
    /** 中文工作台：任务标题与链接只来自中文关键词页，不混入英文 how-to（避免标题仍是英文） */
    if (!zhOnlyTasks) {
      for (const slug of enSlugs) {
        if (tasks.length >= 12) break;
        const content = getEnHowToContent(slug);
        if (!content) continue;
        const pageUrl = `${BASE_URL}/en/how-to/${slug}`;
        const oneLiner = content.directAnswer?.slice(0, 120) || content.description?.slice(0, 120) || "";
        addTask(slug, "en-how-to", content.title, content.title, oneLiner, pageUrl);
      }
    }

    const assigned: MissionTask[] = [];
    const redditTarget = 5;
    const xTarget = 3;
    const quoraTarget = 2;
    const boostTarget = 2;
    let r = 0, x = 0, q = 0, b = 0;
    for (const t of tasks) {
      if (r < redditTarget) { assigned.push({ ...t, platform: "reddit" }); r++; }
      else if (x < xTarget) { assigned.push({ ...t, platform: "x" }); x++; }
      else if (q < quoraTarget) { assigned.push({ ...t, platform: "quora" }); q++; }
      else if (b < boostTarget) { assigned.push({ ...t, platform: "boost" }); b++; }
      if (assigned.length >= 12) break;
    }

    return NextResponse.json({
      tasks: assigned,
      todayByPlatform,
      streak,
      targets: { reddit: 5, x: 3, quora: 2, boost: 2 }
    });
  } catch (e) {
    console.error("[growth-mission/today]", e);
    return NextResponse.json({ tasks: [], todayByPlatform: { reddit: 0, x: 0, quora: 0 }, streak: 0 });
  }
}
