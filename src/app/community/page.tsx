import { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { getLatestCreatorPosts } from "@/lib/creator-posts";
import { Lightbulb, MessageSquareText, BookOpen } from "lucide-react";
import { BASE_URL } from "@/config/site";

export const dynamic = "force-dynamic";

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  prompt: MessageSquareText,
  idea: Lightbulb,
  guide: BookOpen
};

const TYPE_LABELS: Record<string, string> = {
  prompt: "Prompt",
  idea: "Idea",
  guide: "Guide"
};

const TYPE_ROUTES: Record<string, string> = {
  prompt: "prompts",
  idea: "ideas",
  guide: "guides"
};

export const metadata: Metadata = {
  title: "Community | ToolEagle",
  description: "Creator prompts, ideas, and guides from the ToolEagle community.",
  alternates: { canonical: `${BASE_URL}/community` },
  openGraph: { title: "Community | ToolEagle", description: "Creator prompts, ideas, and guides from the ToolEagle community.", url: `${BASE_URL}/community` }
};

export default async function CommunityPage() {
  const posts = await getLatestCreatorPosts(48);

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1">
        <section className="container py-12">
          <div className="max-w-3xl">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
              Community
            </h1>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Prompts, ideas, and guides from creators. Discover content to level up your TikTok, YouTube, and Instagram.
            </p>

            <div className="mt-8 flex gap-4">
              <Link href="/community/prompts" className="text-sm font-medium text-sky-600 hover:underline">
                Prompts
              </Link>
              <Link href="/community/ideas" className="text-sm font-medium text-sky-600 hover:underline">
                Ideas
              </Link>
              <Link href="/community/guides" className="text-sm font-medium text-sky-600 hover:underline">
                Guides
              </Link>
              <Link href="/dashboard/create" className="text-sm font-medium text-sky-600 hover:underline">
                Publish →
              </Link>
            </div>

            {posts.length === 0 ? (
              <div className="mt-12 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center">
                <p className="text-slate-600">No community posts yet. Be the first to publish!</p>
                <Link href="/dashboard/create" className="mt-4 inline-flex rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700">
                  Create your first post
                </Link>
              </div>
            ) : (
              <ul className="mt-8 space-y-4">
                {posts.map((p) => {
                  const Icon = TYPE_ICONS[p.type] ?? MessageSquareText;
                  const author = p.creators as { username?: string; display_name?: string } | undefined;
                  return (
                    <li key={p.id}>
                      <Link
                        href={`/community/${TYPE_ROUTES[p.type]}/${p.slug}`}
                        className="block rounded-xl border border-slate-200 px-5 py-4 hover:border-sky-300 hover:shadow-md transition"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-medium text-sky-600 uppercase tracking-wide">{TYPE_LABELS[p.type]}</span>
                            <h2 className="mt-1 font-semibold text-slate-900">{p.title}</h2>
                            <p className="mt-1 text-sm text-slate-600 line-clamp-2">{p.content.slice(0, 150)}…</p>
                            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                              <Link href={`/creators/${author?.username ?? "unknown"}`} className="hover:text-sky-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                                {author?.display_name || author?.username || "Creator"}
                              </Link>
                              <span>·</span>
                              <span>{new Date(p.created_at).toLocaleDateString()}</span>
                              {p.topic && (
                                <>
                                  <span>·</span>
                                  <Link href={`/topics/${p.topic}`} className="hover:text-sky-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                                    {p.topic}
                                  </Link>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/topics" className="text-sm font-medium text-sky-600 hover:underline">
                Browse topics
              </Link>
              <Link href="/creators" className="text-sm font-medium text-sky-600 hover:underline">
                Discover creators
              </Link>
              <Link href="/dashboard/create" className="text-sm font-medium text-sky-600 hover:underline">
                Publish content
              </Link>
            </div>
          </div>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
