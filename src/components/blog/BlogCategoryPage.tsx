import Link from "next/link";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { SiteFooter } from "@/app/_components/SiteFooter";
import type { BlogPost } from "@/lib/blog";

const BLOG_CATEGORIES = [
  { slug: "tiktok", label: "TikTok" },
  { slug: "youtube", label: "YouTube" },
  { slug: "instagram", label: "Instagram" },
  { slug: "creator-tips", label: "Creator Tips" },
  { slug: "ai-tools", label: "AI Tools" }
] as const;

function matchesCategory(post: BlogPost, categorySlug: string): boolean {
  const category = post.frontmatter.category?.toLowerCase();
  const tags = post.frontmatter.tags ?? [];
  const tagLower = tags.map((t) => t.toLowerCase());
  const cat = categorySlug.toLowerCase();

  if (category) {
    if (cat === "tiktok") return category === "tiktok";
    if (cat === "youtube") return category === "youtube";
    if (cat === "instagram") return category === "instagram";
    if (cat === "creator-tips") return category === "creator tips";
    if (cat === "ai-tools") return category === "ai tools";
  }

  if (cat === "tiktok") return tagLower.includes("tiktok") || tagLower.some((t) => t.includes("tiktok"));
  if (cat === "youtube") return tagLower.includes("youtube") || tagLower.some((t) => t.includes("youtube"));
  if (cat === "instagram") return tagLower.includes("instagram") || tagLower.some((t) => t.includes("instagram"));
  if (cat === "creator-tips") return tagLower.some((t) => ["strategy", "tips", "creator", "growth"].includes(t));
  if (cat === "ai-tools") return tagLower.some((t) => ["ai", "tools", "generator"].includes(t));

  return false;
}

type BlogCategoryPageProps = {
  categorySlug: string;
  categoryLabel: string;
  posts: BlogPost[];
  metadata: { title: string; description: string };
};

export function BlogCategoryPage({
  categorySlug,
  categoryLabel,
  posts,
  metadata
}: BlogCategoryPageProps) {
  const filteredPosts = posts.filter((p) => matchesCategory(p, categorySlug));

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="container pt-10 pb-16">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
              {categoryLabel}
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              {metadata.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {metadata.description}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/blog"
              className="inline-flex rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              All
            </Link>
            {BLOG_CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={`/blog/${c.slug}`}
                className={`inline-flex rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  c.slug === categorySlug
                    ? "bg-sky-600 text-white"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {c.label}
              </Link>
            ))}
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <Link
                  key={post.frontmatter.slug}
                  href={`/blog/${post.frontmatter.slug}`}
                  className="group block rounded-2xl border border-slate-200 bg-white p-6 hover:border-sky-500/70 hover:shadow-md transition"
                >
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-2">
                    {post.frontmatter.tags?.[0] && (
                      <span className="px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50">
                        {post.frontmatter.tags[0]}
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-semibold text-slate-900">
                    {post.frontmatter.title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    {post.frontmatter.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {new Date(post.frontmatter.date).toLocaleDateString()}
                    </span>
                    <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white group-hover:bg-slate-800">
                      Read article
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="col-span-full text-sm text-slate-500 py-8">
                No articles in this category yet.{" "}
                <Link href="/blog" className="text-sky-600 hover:underline">
                  Browse all articles →
                </Link>
              </p>
            )}
          </div>

          <Link
            href="/blog"
            className="mt-8 inline-block text-sm font-medium text-sky-600 hover:text-sky-800"
          >
            ← All articles
          </Link>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
