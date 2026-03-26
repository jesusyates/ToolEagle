import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

/** V106: Crawl entry — recent EN blog posts from homepage (server component). */
export async function HomeLatestBlogStrip() {
  const posts = await getAllPosts();
  const latest = posts.slice(0, 8);
  if (latest.length === 0) return null;

  return (
    <section className="container py-10 sm:py-12 border-t border-slate-100" aria-labelledby="home-latest-blog">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="home-latest-blog" className="text-xl sm:text-2xl font-semibold text-slate-900">
            Latest creator guides
          </h2>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-relaxed">
            Fresh how-tos and ideas—pick a post and jump straight into a publish-ready workflow.
          </p>
        </div>
        <Link href="/blog" className="text-sm font-medium text-sky-600 hover:text-sky-800 shrink-0">
          All posts →
        </Link>
      </div>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {latest.map((post) => (
          <li key={post.frontmatter.slug}>
            <Link
              href={`/blog/${post.frontmatter.slug}`}
              className="block rounded-2xl border border-slate-200 bg-white p-4 hover:border-sky-300 hover:shadow-sm transition"
            >
              <span className="text-sm font-semibold text-slate-900 line-clamp-2">{post.frontmatter.title}</span>
              <span className="mt-1 block text-xs text-slate-600 line-clamp-2">{post.frontmatter.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
