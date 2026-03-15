import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { User } from "lucide-react";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("username", username)
    .single();

  if (!profile) return { title: "Creator not found" };

  const name = profile.display_name || profile.username || username;
  return {
    title: `${name} | ToolEagle Creator`,
    description: `Creator profile for ${name}. See their posts and tools used.`
  };
}

export default async function CreatorProfilePage({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio")
    .eq("username", username)
    .single();

  if (!profile) {
    notFound();
  }

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, title, slug, description, created_at")
    .eq("author_id", profile.id)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: history } = await supabase
    .from("generation_history")
    .select("tool_slug, tool_name, input, created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const toolCounts: Record<string, number> = {};
  for (const h of history ?? []) {
    toolCounts[h.tool_name] = (toolCounts[h.tool_name] ?? 0) + 1;
  }
  const topToolsUsed = Object.entries(toolCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name]) => name);

  const recentGenerations = (history ?? []).slice(0, 10);

  const displayName = profile.display_name || profile.username || username;

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="container py-12">
          <div className="max-w-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-100 border border-slate-200">
                <User className="h-8 w-8 text-slate-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">{displayName}</h1>
                <p className="text-slate-600">@{profile.username}</p>
                {profile.bio && (
                  <p className="mt-2 text-slate-700 leading-relaxed">{profile.bio}</p>
                )}
              </div>
            </div>

            {topToolsUsed.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-slate-900">Top Tools Used</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {topToolsUsed.map((name) => (
                    <span
                      key={name}
                      className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {recentGenerations.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-slate-900">Recent Generations</h2>
                <ul className="mt-4 space-y-2">
                  {recentGenerations.map((g, i) => (
                    <li
                      key={i}
                      className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm"
                    >
                      <span className="font-medium text-slate-700">{g.tool_name}</span>
                      <p className="mt-1 text-slate-600 line-clamp-2">{g.input}</p>
                      <span className="mt-1 inline-block text-xs text-slate-500">
                        {new Date(g.created_at).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {posts && posts.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-slate-900">Published Posts</h2>
                <ul className="mt-4 space-y-3">
                  {posts.map((post) => (
                    <li key={post.id}>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="block rounded-xl border border-slate-200 p-4 hover:border-sky-300 hover:shadow-md transition"
                      >
                        <h3 className="font-medium text-slate-900">{post.title}</h3>
                        {post.description && (
                          <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                            {post.description}
                          </p>
                        )}
                        <span className="mt-2 inline-block text-xs text-slate-500">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(!posts || posts.length === 0) && (!profile.bio || profile.bio.trim() === "") && topToolsUsed.length === 0 && recentGenerations.length === 0 && (
              <p className="mt-8 text-slate-500">This creator hasn&apos;t shared anything yet.</p>
            )}

            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/creators" className="text-sm font-medium text-sky-600 hover:underline">
                ← Discover Creators
              </Link>
              <Link href="/creator" className="text-sm font-medium text-sky-600 hover:underline">
                Creator Mode
              </Link>
            </div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
