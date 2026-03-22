import Link from "next/link";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { User } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Discover Creators | ToolEagle",
  description: "Meet creators who use ToolEagle. See their tools, posts, and content."
};

type CreatorCard = {
  username: string;
  displayName: string;
  bio: string | null;
  toolsUsed: string[];
  postsCount: number;
  platform: "tiktok" | "youtube" | "instagram" | null;
  updatedAt: string;
};

async function getCreators(): Promise<CreatorCard[]> {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, updated_at")
    .not("username", "is", null)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (!profiles?.length) return [];

  const ids = profiles.map((p) => p.id);

  const [postsRes, historyRes] = await Promise.all([
    supabase
      .from("blog_posts")
      .select("author_id")
      .eq("status", "published")
      .in("author_id", ids),
    supabase
      .from("generation_history")
      .select("user_id, tool_slug, tool_name")
      .in("user_id", ids)
  ]);

  const postsByAuthor: Record<string, number> = {};
  for (const p of postsRes.data ?? []) {
    if (p.author_id) postsByAuthor[p.author_id] = (postsByAuthor[p.author_id] ?? 0) + 1;
  }

  const toolsByUser: Record<string, Set<string>> = {};
  const platformByUser: Record<string, { tiktok: number; youtube: number; instagram: number }> = {};
  for (const h of historyRes.data ?? []) {
    if (!toolsByUser[h.user_id]) toolsByUser[h.user_id] = new Set();
    toolsByUser[h.user_id].add(h.tool_name);
    if (!platformByUser[h.user_id]) platformByUser[h.user_id] = { tiktok: 0, youtube: 0, instagram: 0 };
    if (h.tool_slug.includes("tiktok")) platformByUser[h.user_id].tiktok++;
    else if (h.tool_slug.includes("youtube")) platformByUser[h.user_id].youtube++;
    else if (h.tool_slug.includes("instagram") || h.tool_slug.includes("reel")) platformByUser[h.user_id].instagram++;
  }

  return profiles.map((p) => {
    const tools = Array.from(toolsByUser[p.id] ?? []).slice(0, 6);
    const platforms = platformByUser[p.id];
    let platform: "tiktok" | "youtube" | "instagram" | null = null;
    if (platforms) {
      const max = Math.max(platforms.tiktok, platforms.youtube, platforms.instagram);
      if (max > 0) {
        if (platforms.tiktok === max) platform = "tiktok";
        else if (platforms.youtube === max) platform = "youtube";
        else if (platforms.instagram === max) platform = "instagram";
      }
    }
    return {
      username: p.username!,
      displayName: p.display_name || p.username || "",
      bio: p.bio,
      toolsUsed: tools,
      postsCount: postsByAuthor[p.id] ?? 0,
      platform,
      updatedAt: p.updated_at
    };
  });
}

function CreatorCard({ c }: { c: CreatorCard }) {
  const displayName = c.displayName || c.username;
  return (
    <Link
      href={`/creators/${c.username}`}
      className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-sky-300 hover:shadow-md transition"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-100 border border-slate-200">
          <User className="h-7 w-7 text-slate-600" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900">{displayName}</h3>
          <p className="text-sm text-slate-600">@{c.username}</p>
          {c.bio && (
            <p className="mt-2 text-sm text-slate-700 line-clamp-2">{c.bio}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {c.toolsUsed.slice(0, 4).map((t) => (
              <span
                key={t}
                className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600"
              >
                {t}
              </span>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
            <span>{c.postsCount} posts</span>
            {c.platform && (
              <span className="capitalize">{c.platform}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default async function CreatorsPage() {
  const creators = await getCreators();

  const featured = creators
    .filter((c) => c.postsCount > 0 || c.toolsUsed.length >= 3)
    .slice(0, 6);
  const latest = creators.slice(0, 12);
  const byPlatform = {
    tiktok: creators.filter((c) => c.platform === "tiktok").slice(0, 8),
    youtube: creators.filter((c) => c.platform === "youtube").slice(0, 8),
    instagram: creators.filter((c) => c.platform === "instagram").slice(0, 8)
  };

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="container py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">
              Discover Creators
            </h1>
            <p className="mt-4 text-xl text-slate-600">
              Meet creators who use ToolEagle to grow their audience. See their tools, posts, and content.
            </p>
          </div>
        </section>

        {creators.length === 0 ? (
          <section className="container pb-16">
            <div className="max-w-2xl mx-auto rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center">
              <p className="text-slate-600">No creators yet.</p>
              <p className="mt-2 text-sm text-slate-500">
                Set a username in your dashboard to get a public creator profile.
              </p>
              <Link
                href="/dashboard/settings"
                className="mt-4 inline-flex rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
              >
                Set up your profile
              </Link>
            </div>
          </section>
        ) : (
          <>
            {featured.length > 0 && (
              <section className="container pb-12">
                <h2 className="text-xl font-semibold text-slate-900 mb-6">Featured Creators</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {featured.map((c) => (
                    <CreatorCard key={c.username} c={c} />
                  ))}
                </div>
              </section>
            )}

            <section className="container pb-12">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Latest Creators</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {latest.map((c) => (
                  <CreatorCard key={c.username} c={c} />
                ))}
              </div>
            </section>

            {(byPlatform.tiktok.length > 0 || byPlatform.youtube.length > 0 || byPlatform.instagram.length > 0) && (
              <section className="container pb-16">
                <h2 className="text-xl font-semibold text-slate-900 mb-6">Creators by Platform</h2>
                <div className="grid gap-8 md:grid-cols-3">
                  {byPlatform.tiktok.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-slate-800 mb-4">TikTok</h3>
                      <div className="space-y-3">
                        {byPlatform.tiktok.map((c) => (
                          <CreatorCard key={c.username} c={c} />
                        ))}
                      </div>
                    </div>
                  )}
                  {byPlatform.youtube.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-slate-800 mb-4">YouTube</h3>
                      <div className="space-y-3">
                        {byPlatform.youtube.map((c) => (
                          <CreatorCard key={c.username} c={c} />
                        ))}
                      </div>
                    </div>
                  )}
                  {byPlatform.instagram.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-slate-800 mb-4">Instagram</h3>
                      <div className="space-y-3">
                        {byPlatform.instagram.map((c) => (
                          <CreatorCard key={c.username} c={c} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        )}

        <section className="container pb-16">
          <div className="flex flex-wrap gap-4">
            <Link href="/creator" className="text-sm font-medium text-sky-600 hover:underline">
              Creator Mode →
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
