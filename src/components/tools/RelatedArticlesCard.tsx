import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

type RelatedArticlesCardProps = {
  tags?: string[];
  limit?: number;
};

function scorePost(
  post: { frontmatter: { tags?: string[] } },
  tags: string[]
): number {
  if (!post.frontmatter.tags?.length || !tags.length) return 0;
  const lower = tags.map((t) => t.toLowerCase());
  return post.frontmatter.tags.filter((t) =>
    lower.includes(t.toLowerCase())
  ).length;
}

export function RelatedArticlesCard({
  tags = [],
  limit = 3
}: RelatedArticlesCardProps) {
  const posts = getAllPosts()
    .map((post) => ({ post, score: scorePost(post, tags) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ post }) => post);

  if (posts.length === 0) {
    const fallback = getAllPosts().slice(0, limit);
    if (fallback.length === 0) return null;
    return (
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6 shadow-sm">
        <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
          From the blog
        </p>
        <ul className="mt-3 space-y-2">
          {fallback.map((post) => (
            <li key={post.frontmatter.slug}>
              <Link
                href={`/blog/${post.frontmatter.slug}`}
                className="text-sm text-slate-700 hover:text-sky-700 hover:underline transition duration-150"
              >
                {post.frontmatter.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6 shadow-sm">
      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
        Related articles
      </p>
      <ul className="mt-3 space-y-2">
        {posts.map((post) => (
          <li key={post.frontmatter.slug}>
            <Link
              href={`/blog/${post.frontmatter.slug}`}
              className="text-sm text-slate-700 hover:text-sky-700 hover:underline transition duration-150"
            >
              {post.frontmatter.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
