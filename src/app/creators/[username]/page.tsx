import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { User, FileText, Hash } from "lucide-react";
import { FollowButton } from "@/components/follow/FollowButton";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("username", username)
    .single();

  const { data: examples } = await supabase
    .from("public_examples")
    .select("id")
    .eq("creator_username", username)
    .limit(1);

  if (!profile && (!examples || examples.length === 0)) {
    return { title: "Creator not found" };
  }

  const name = profile?.display_name || profile?.username || username;
  return {
    title: `${name} | ToolEagle Creator`,
    description: `Creator profile for ${name}. See their examples, topics, and stats.`
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

  const { data: examples } = await supabase
    .from("public_examples")
    .select("slug, tool_name, tool_slug, result, created_at")
    .eq("creator_username", username)
    .not("slug", "is", null)
    .order("created_at", { ascending: false })
    .limit(24);

  const hasProfile = !!profile;
  const hasExamples = (examples?.length ?? 0) > 0;

  if (!hasProfile && !hasExamples) {
    notFound();
  }

  const displayName = profile?.display_name || profile?.username || username;

  const toolCounts: Record<string, number> = {};
  const topicWords = new Set<string>();
  for (const ex of examples ?? []) {
    toolCounts[ex.tool_name] = (toolCounts[ex.tool_name] ?? 0) + 1;
    const words = (ex.result ?? "").toLowerCase().split(/\s+/).filter((w: string) => w.length > 4);
    words.slice(0, 5).forEach((w: string) => topicWords.add(w));
  }

  const topTools = Object.entries(toolCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name]) => name);

  const topics = Array.from(topicWords).slice(0, 12);

  const stats = {
    examples: examples?.length ?? 0,
    tools: Object.keys(toolCounts).length,
    topics: topics.length
  };

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
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-semibold text-slate-900">{displayName}</h1>
                <p className="text-slate-600">@{username}</p>
                {profile?.bio && (
                  <p className="mt-2 text-slate-700 leading-relaxed">{profile.bio}</p>
                )}
                <div className="mt-3">
                  <FollowButton username={username} />
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
                <FileText className="h-4 w-4 text-sky-600" />
                <span className="text-sm font-medium text-slate-700">{stats.examples} examples</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
                <span className="text-sm font-medium text-slate-700">{stats.tools} tools used</span>
              </div>
              {topics.length > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
                  <Hash className="h-4 w-4 text-sky-600" />
                  <span className="text-sm font-medium text-slate-700">{topics.length} topics</span>
                </div>
              )}
            </div>

            {topTools.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-slate-900">Top Tools Used</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {topTools.map((name) => (
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

            {examples && examples.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-slate-900">Creator Examples</h2>
                <ul className="mt-4 space-y-2">
                  {examples.slice(0, 12).map((ex) => (
                    <li key={ex.slug}>
                      <Link
                        href={`/examples/${ex.slug}`}
                        className="block rounded-xl border border-slate-200 px-4 py-3 hover:border-sky-300 hover:shadow-md transition"
                      >
                        <span className="text-xs font-medium text-sky-600">{ex.tool_name}</span>
                        <p className="mt-1 text-sm text-slate-800 line-clamp-2">{ex.result}</p>
                        <span className="mt-1 inline-block text-xs text-slate-500">
                          {new Date(ex.created_at).toLocaleDateString()}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                {examples.length > 12 && (
                  <Link
                    href={`/examples?creator=${username}`}
                    className="mt-3 inline-block text-sm font-medium text-sky-600 hover:underline"
                  >
                    View all {examples.length} examples →
                  </Link>
                )}
              </div>
            )}

            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/creators" className="text-sm font-medium text-sky-600 hover:underline">
                ← Discover Creators
              </Link>
              <Link href="/creator" className="text-sm font-medium text-sky-600 hover:underline">
                Creator Mode
              </Link>
              <Link href="/examples" className="text-sm font-medium text-sky-600 hover:underline">
                All Examples
              </Link>
            </div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
