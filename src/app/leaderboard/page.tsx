import Link from "next/link";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { Trophy, Zap, MessageSquareText, Sparkles, Wrench } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Creator Leaderboard | ToolEagle",
  description: "Top creators, most used tools, and trending content on ToolEagle."
};

async function getLeaderboardData() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .not("username", "is", null);

  if (!profiles?.length) {
    const [examplesRes, captionsRes, hooksRes] = await Promise.all([
      supabase.from("public_examples").select("slug, tool_name, result, creator_username").not("slug", "is", null).order("created_at", { ascending: false }).limit(10),
      supabase.from("public_examples").select("slug, tool_name, result, creator_username").in("tool_slug", ["tiktok-caption-generator", "instagram-caption-generator"]).not("slug", "is", null).order("created_at", { ascending: false }).limit(10),
      supabase.from("public_examples").select("slug, tool_name, result, creator_username").in("tool_slug", ["hook-generator", "youtube-hook-generator"]).not("slug", "is", null).order("created_at", { ascending: false }).limit(10)
    ]);
    return {
      topCreators: [],
      topTools: [],
      topExamples: examplesRes.data ?? [],
      topCaptions: captionsRes.data ?? [],
      topHooks: hooksRes.data ?? [],
      profileMap: {}
    };
  }

  const ids = profiles.map((p) => p.id);

  const [historyRes, postsRes] = await Promise.all([
    supabase.from("generation_history").select("user_id, tool_slug, tool_name").in("user_id", ids),
    supabase
      .from("blog_posts")
      .select("author_id")
      .eq("status", "published")
      .in("author_id", ids)
  ]);

  const genByUser: Record<string, number> = {};
  const genByTool: Record<string, number> = {};
  for (const h of historyRes.data ?? []) {
    genByUser[h.user_id] = (genByUser[h.user_id] ?? 0) + 1;
    const key = h.tool_name;
    genByTool[key] = (genByTool[key] ?? 0) + 1;
  }

  const postsByUser: Record<string, number> = {};
  for (const p of postsRes.data ?? []) {
    if (p.author_id) postsByUser[p.author_id] = (postsByUser[p.author_id] ?? 0) + 1;
  }

  const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]));

  const topCreators = profiles
    .map((p) => ({
      username: p.username!,
      displayName: p.display_name || p.username || "",
      generations: genByUser[p.id] ?? 0,
      posts: postsByUser[p.id] ?? 0,
      score: (genByUser[p.id] ?? 0) * 2 + (postsByUser[p.id] ?? 0) * 10
    }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const topTools = Object.entries(genByTool)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const CAPTION_SLUGS = ["tiktok-caption-generator", "instagram-caption-generator"];
  const HOOK_SLUGS = ["hook-generator", "youtube-hook-generator"];

  const [examplesRes, captionsRes, hooksRes] = await Promise.all([
    supabase
      .from("public_examples")
      .select("slug, tool_name, result, creator_username")
      .not("slug", "is", null)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("public_examples")
      .select("slug, tool_name, result, creator_username")
      .in("tool_slug", CAPTION_SLUGS)
      .not("slug", "is", null)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("public_examples")
      .select("slug, tool_name, result, creator_username")
      .in("tool_slug", HOOK_SLUGS)
      .not("slug", "is", null)
      .order("created_at", { ascending: false })
      .limit(10)
  ]);

  const topExamples = examplesRes.data ?? [];
  const topCaptions = captionsRes.data ?? [];
  const topHooks = hooksRes.data ?? [];

  return { topCreators, topTools, topExamples, topCaptions, topHooks, profileMap };
}

export default async function LeaderboardPage() {
  const { topCreators, topTools, topExamples, topCaptions, topHooks } = await getLeaderboardData();

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="container py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">
              Creator Leaderboard
            </h1>
            <p className="mt-4 text-xl text-slate-600">
              Top creators and most used tools on ToolEagle.
            </p>
          </div>
        </section>

        <section className="container pb-12">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2 mb-6">
            <Trophy className="h-5 w-5 text-amber-500" />
            Top Creators
          </h2>
          {topCreators.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-slate-600">No creator activity yet.</p>
              <Link href="/creators" className="mt-4 inline-block text-sm font-medium text-sky-600 hover:underline">
                Discover creators →
              </Link>
            </div>
          ) : (
            <ol className="space-y-3">
              {topCreators.map((c, i) => (
                <li key={c.username}>
                  <Link
                    href={`/creators/${c.username}`}
                    className="flex items-center gap-4 rounded-xl border border-slate-200 p-4 hover:border-sky-300 hover:shadow-md transition"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-bold text-slate-700">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-slate-900">{c.displayName || c.username}</span>
                      <span className="ml-2 text-sm text-slate-500">@{c.username}</span>
                    </div>
                    <div className="flex gap-4 text-sm text-slate-600">
                      <span>{c.generations} generations</span>
                      <span>{c.posts} posts</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="container pb-12">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2 mb-6">
            <Wrench className="h-5 w-5 text-sky-500" />
            Most Used Tools
          </h2>
          {topTools.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-slate-600">No tool usage data yet.</p>
              <Link href="/tools" className="mt-4 inline-block text-sm font-medium text-sky-600 hover:underline">
                Try our tools →
              </Link>
            </div>
          ) : (
            <ol className="space-y-3">
              {topTools.map((t, i) => (
                <li key={t.name}>
                  <div className="flex items-center gap-4 rounded-xl border border-slate-200 p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-bold text-slate-700">
                      {i + 1}
                    </span>
                    <span className="font-medium text-slate-900">{t.name}</span>
                    <span className="ml-auto text-sm text-slate-500">{t.count} uses</span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="container pb-12">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Top Examples
          </h2>
          {topExamples.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-slate-600">No public examples yet.</p>
              <Link href="/submit" className="mt-4 inline-block text-sm font-medium text-sky-600 hover:underline">
                Submit your example →
              </Link>
            </div>
          ) : (
            <ol className="space-y-3">
              {topExamples.map((ex, i) => (
                <li key={ex.slug}>
                  <Link
                    href={`/examples/${ex.slug}`}
                    className="flex items-center gap-4 rounded-xl border border-slate-200 p-4 hover:border-sky-300 transition"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-bold text-slate-700">
                      {i + 1}
                    </span>
                    <p className="min-w-0 flex-1 text-sm text-slate-800 line-clamp-2">{ex.result}</p>
                    {ex.creator_username && (
                      <Link
                        href={`/creators/${ex.creator_username}`}
                        className="shrink-0 text-sm text-sky-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        @{ex.creator_username}
                      </Link>
                    )}
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="container pb-12">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2 mb-6">
            <MessageSquareText className="h-5 w-5 text-sky-500" />
            Top Captions
          </h2>
          {topCaptions.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-slate-600">No caption examples yet.</p>
              <Link href="/tools/tiktok-caption-generator" className="mt-4 inline-block text-sm font-medium text-sky-600 hover:underline">
                Generate captions →
              </Link>
            </div>
          ) : (
            <ol className="space-y-3">
              {topCaptions.map((ex, i) => (
                <li key={ex.slug}>
                  <Link
                    href={`/examples/${ex.slug}`}
                    className="flex items-center gap-4 rounded-xl border border-slate-200 p-4 hover:border-sky-300 transition"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-bold text-slate-700">
                      {i + 1}
                    </span>
                    <p className="min-w-0 flex-1 text-sm text-slate-800 line-clamp-2">{ex.result}</p>
                    {ex.creator_username && (
                      <span className="shrink-0 text-sm text-slate-500">@{ex.creator_username}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="container pb-12">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2 mb-6">
            <Zap className="h-5 w-5 text-amber-500" />
            Top Hooks
          </h2>
          {topHooks.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-slate-600">No hook examples yet.</p>
              <Link href="/tools/hook-generator" className="mt-4 inline-block text-sm font-medium text-sky-600 hover:underline">
                Generate hooks →
              </Link>
            </div>
          ) : (
            <ol className="space-y-3">
              {topHooks.map((ex, i) => (
                <li key={ex.slug}>
                  <Link
                    href={`/examples/${ex.slug}`}
                    className="flex items-center gap-4 rounded-xl border border-slate-200 p-4 hover:border-sky-300 transition"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-bold text-slate-700">
                      {i + 1}
                    </span>
                    <p className="min-w-0 flex-1 text-sm text-slate-800 line-clamp-2">{ex.result}</p>
                    {ex.creator_username && (
                      <span className="shrink-0 text-sm text-slate-500">@{ex.creator_username}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="container pb-16">
          <div className="flex flex-wrap gap-4">
            <Link href="/creators" className="text-sm font-medium text-sky-600 hover:underline">
              Discover Creators →
            </Link>
            <Link href="/examples" className="text-sm font-medium text-sky-600 hover:underline">
              All Examples →
            </Link>
            <Link href="/tools" className="text-sm font-medium text-sky-600 hover:underline">
              AI Tools →
            </Link>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
