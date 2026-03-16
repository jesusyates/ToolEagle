import { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { getLatestCreatorPosts } from "@/lib/creator-posts";
import { BASE_URL } from "@/config/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Community Guides | ToolEagle",
  description: "How-to guides from creators for TikTok, YouTube, and Instagram.",
  alternates: { canonical: `${BASE_URL}/community/guides` }
};

export default async function CommunityGuidesPage() {
  const all = await getLatestCreatorPosts(100);
  const posts = all.filter((p) => p.type === "guide");

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1">
        <section className="container py-12">
          <div className="max-w-3xl">
            <Link href="/community" className="text-sm font-medium text-sky-600 hover:underline">← Community</Link>
            <h1 className="mt-4 text-2xl font-semibold text-slate-900">Guides</h1>
            <p className="mt-2 text-slate-600">Creator how-to guides.</p>
            {posts.length === 0 ? (
              <p className="mt-8 text-slate-500">No guides yet.</p>
            ) : (
              <ul className="mt-6 space-y-3">
                {posts.map((p) => {
                  const author = p.creators as { username?: string; display_name?: string } | undefined;
                  return (
                    <li key={p.id}>
                      <Link href={`/community/guides/${p.slug}`} className="block rounded-xl border border-slate-200 px-4 py-3 hover:border-sky-300 transition">
                        <h2 className="font-medium text-slate-900">{p.title}</h2>
                        <p className="mt-1 text-sm text-slate-600 line-clamp-1">{p.content.slice(0, 100)}…</p>
                        <span className="mt-1 inline-block text-xs text-slate-500">
                          {author?.display_name || author?.username} · {new Date(p.created_at).toLocaleDateString()}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
