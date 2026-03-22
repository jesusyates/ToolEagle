import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import Image from "next/image";
import { User, FileText, Hash, ExternalLink, Twitter, Youtube } from "lucide-react";
import { FollowButton } from "@/components/follow/FollowButton";
import { getCreatorByUsername, getCreatorPostsByUsername } from "@/lib/creator-posts";
import { BASE_URL } from "@/config/site";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const creator = await getCreatorByUsername(username);
  if (creator) {
    const name = creator.display_name || creator.username;
    const desc = creator.bio?.slice(0, 160) || `Creator profile for ${name}. Prompts, ideas, and guides.`;
    return {
      title: `${name} | ToolEagle Creator`,
      description: desc,
      alternates: { canonical: `${BASE_URL}/creators/${username}` },
      openGraph: { title: `${name} | ToolEagle Creator`, description: desc, url: `${BASE_URL}/creators/${username}` }
    };
  }
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("display_name, username").eq("username", username).single();
  const { data: examples } = await supabase.from("public_examples").select("id").eq("creator_username", username).limit(1);
  if (!profile && (!examples || examples.length === 0)) return { title: "Creator not found" };
  const name = profile?.display_name || profile?.username || username;
  return { title: `${name} | ToolEagle Creator`, description: `Creator profile for ${name}. See their examples, topics, and stats.` };
}

const POST_TYPE_LABELS: Record<string, string> = { prompt: "Prompts", idea: "Ideas", guide: "Guides" };
const POST_TYPE_ROUTES: Record<string, string> = { prompt: "/community/prompts", idea: "/community/ideas", guide: "/community/guides" };

export default async function CreatorProfilePage({ params }: Props) {
  const { username } = await params;
  const creator = await getCreatorByUsername(username);

  if (creator) {
    const posts = await getCreatorPostsByUsername(username);
    const byType = { prompt: posts.filter((p) => p.type === "prompt"), idea: posts.filter((p) => p.type === "idea"), guide: posts.filter((p) => p.type === "guide") };
    const displayName = creator.display_name || creator.username;

    return (
      <main className="min-h-screen bg-page text-slate-900 flex flex-col">
        <SiteHeader />
        <div className="flex-1">
          <section className="container py-12">
            <div className="max-w-2xl">
              <div className="flex items-start gap-4">
                {creator.avatar_url ? (
                  <Image src={creator.avatar_url} alt="" width={64} height={64} className="shrink-0 rounded-2xl object-cover border border-slate-200" unoptimized />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-100 border border-slate-200">
                    <User className="h-8 w-8 text-slate-600" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-semibold text-slate-900">{displayName}</h1>
                  <p className="text-slate-600">@{creator.username}</p>
                  {creator.bio && <p className="mt-2 text-slate-700 leading-relaxed">{creator.bio}</p>}
                  <div className="mt-3 flex flex-wrap gap-3">
                    {creator.website && (
                      <a href={creator.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-sky-600 hover:underline">
                        <ExternalLink className="h-4 w-4" /> Website
                      </a>
                    )}
                    {creator.twitter && (
                      <a href={creator.twitter.startsWith("http") ? creator.twitter : `https://twitter.com/${creator.twitter}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-sky-600 hover:underline">
                        <Twitter className="h-4 w-4" /> Twitter
                      </a>
                    )}
                    {creator.youtube && (
                      <a href={creator.youtube.startsWith("http") ? creator.youtube : `https://youtube.com/${creator.youtube}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-sky-600 hover:underline">
                        <Youtube className="h-4 w-4" /> YouTube
                      </a>
                    )}
                  </div>
                  <div className="mt-3">
                    <FollowButton username={creator.username} />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-4">
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
                  <FileText className="h-4 w-4 text-sky-600" />
                  <span className="text-sm font-medium text-slate-700">{posts.length} posts</span>
                </div>
                {posts.length > 0 && (
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
                    <Hash className="h-4 w-4 text-sky-600" />
                    <span className="text-sm font-medium text-slate-700">{new Set(posts.map((p) => p.topic).filter(Boolean)).size} topics</span>
                  </div>
                )}
              </div>

              {(["prompt", "idea", "guide"] as const).map((type) =>
                byType[type].length > 0 ? (
                  <div key={type} className="mt-8">
                    <h2 className="text-lg font-semibold text-slate-900">{POST_TYPE_LABELS[type]}</h2>
                    <ul className="mt-4 space-y-2">
                      {byType[type].slice(0, 8).map((p) => (
                        <li key={p.id}>
                          <Link href={`${POST_TYPE_ROUTES[type]}/${p.slug}`} className="block rounded-xl border border-slate-200 px-4 py-3 hover:border-sky-300 hover:shadow-md transition">
                            <span className="text-xs font-medium text-sky-600">{p.topic || "General"}</span>
                            <p className="mt-1 text-sm font-medium text-slate-900">{p.title}</p>
                            <p className="mt-1 text-sm text-slate-600 line-clamp-2">{p.content.slice(0, 120)}…</p>
                            <span className="mt-1 inline-block text-xs text-slate-500">{new Date(p.created_at).toLocaleDateString()}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    {byType[type].length > 8 && (
                      <Link href={`/community?creator=${creator.username}&type=${type}`} className="mt-3 inline-block text-sm font-medium text-sky-600 hover:underline">
                        View all {byType[type].length} {POST_TYPE_LABELS[type].toLowerCase()} →
                      </Link>
                    )}
                  </div>
                ) : null
              )}

              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/community" className="text-sm font-medium text-sky-600 hover:underline">← Community</Link>
                <Link href="/creators" className="text-sm font-medium text-sky-600 hover:underline">Discover Creators</Link>
                <Link href="/creators" className="text-sm font-medium text-sky-600 hover:underline">All Creators</Link>
              </div>
            </div>
          </section>
        </div>
        <SiteFooter />
      </main>
    );
  }

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("id, username, display_name, bio").eq("username", username).single();
  const { data: examples } = await supabase
    .from("public_examples")
    .select("slug, tool_name, tool_slug, result, created_at")
    .eq("creator_username", username)
    .not("slug", "is", null)
    .order("created_at", { ascending: false })
    .limit(24);

  const hasProfile = !!profile;
  const hasExamples = (examples?.length ?? 0) > 0;
  if (!hasProfile && !hasExamples) notFound();

  const displayName = profile?.display_name || profile?.username || username;
  const toolCounts: Record<string, number> = {};
  for (const ex of examples ?? []) {
    toolCounts[ex.tool_name] = (toolCounts[ex.tool_name] ?? 0) + 1;
  }
  const topTools = Object.entries(toolCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name]) => name);
  const topicWords = new Set<string>();
  for (const ex of examples ?? []) {
    (ex.result ?? "").toLowerCase().split(/\s+/).filter((w: string) => w.length > 4).slice(0, 5).forEach((w: string) => topicWords.add(w));
  }
  const topics = Array.from(topicWords).slice(0, 12);

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
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
                {profile?.bio && <p className="mt-2 text-slate-700 leading-relaxed">{profile.bio}</p>}
                <div className="mt-3">
                  <FollowButton username={username} />
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
                <FileText className="h-4 w-4 text-sky-600" />
                <span className="text-sm font-medium text-slate-700">{examples?.length ?? 0} examples</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
                <span className="text-sm font-medium text-slate-700">{Object.keys(toolCounts).length} tools used</span>
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
                    <span key={name} className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700">
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
                      <Link href={`/examples/${ex.slug}`} className="block rounded-xl border border-slate-200 px-4 py-3 hover:border-sky-300 hover:shadow-md transition">
                        <span className="text-xs font-medium text-sky-600">{ex.tool_name}</span>
                        <p className="mt-1 text-sm text-slate-800 line-clamp-2">{ex.result}</p>
                        <span className="mt-1 inline-block text-xs text-slate-500">{new Date(ex.created_at).toLocaleDateString()}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                {examples.length > 12 && (
                  <Link href={`/examples?creator=${username}`} className="mt-3 inline-block text-sm font-medium text-sky-600 hover:underline">
                    View all {examples.length} examples →
                  </Link>
                )}
              </div>
            )}
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/creators" className="text-sm font-medium text-sky-600 hover:underline">← Discover Creators</Link>
              <Link href="/creator" className="text-sm font-medium text-sky-600 hover:underline">Creator Mode</Link>
              <Link href="/examples" className="text-sm font-medium text-sky-600 hover:underline">All Examples</Link>
            </div>
          </div>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
