import Link from "next/link";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { getAllPosts } from "@/lib/blog";

export const metadata = {
  title: "Creator Resources & Tips",
  description:
    "Articles, tips and case studies on how to use ToolEagle tools to publish better content, faster."
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <section className="container pt-10 pb-16">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
              Resources
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Creator playbook & case studies
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Short, practical articles on how real creators use ToolEagle tools to publish better
              content, faster.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            {posts.map((post) => (
              <Link
                key={post.frontmatter.slug}
                href={`/blog/${post.frontmatter.slug}`}
                className="block rounded-2xl border border-slate-200 bg-white p-4 hover:border-sky-500/70 hover:shadow-md transition"
              >
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-1">
                  {post.frontmatter.tags && post.frontmatter.tags[0] && (
                    <span className="px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50">
                      {post.frontmatter.tags[0]}
                    </span>
                  )}
                  <span>Playbook</span>
                </div>
                <h2 className="text-sm font-semibold text-slate-900">
                  {post.frontmatter.title}
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  {post.frontmatter.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}

