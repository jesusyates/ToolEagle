import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { getAllAutoPosts } from "@/lib/auto-posts-reader";

/** SSG: list built from `content/auto-posts` + `content/sent-guides` at build time. */
export const dynamic = "force-static";

export const metadata = {
  title: "Creator Guides | ToolEagle",
  description:
    "Practical creator guides and tutorials—SEO-focused articles to help you publish better content faster."
};

export default async function GuidesListPage() {
  const posts = await getAllAutoPosts();

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1">
        <section className="container pt-10 pb-16">
          <h1 className="text-3xl font-semibold tracking-tight">Creator Guides</h1>
          <p className="mt-2 text-sm text-slate-600">
            In-depth guides and tutorials for creators. Updated as we publish new topics.
          </p>
          <nav className="mt-8" aria-label="Guide articles">
            <ul className="space-y-6">
              {posts.map((post) => (
                <li key={post.slug} className="rounded-2xl border border-slate-200 bg-white p-6">
                  <a
                    href={`/guides/${post.slug}`}
                    className="text-lg font-medium text-sky-700 hover:underline"
                  >
                    {post.title || post.slug}
                  </a>
                  <p className="mt-1 text-xs text-slate-500">{post.publishedAt}</p>
                  {post.description ? (
                    <p className="mt-2 text-sm text-slate-600">{post.description}</p>
                  ) : null}
                  {post.hashtags.length > 0 ? (
                    <p className="mt-2 text-xs text-slate-500">{post.hashtags.join(" ")}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </nav>
          {posts.length === 0 ? <p className="mt-8 text-sm text-slate-500">No guides yet.</p> : null}
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
