import Link from "next/link";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { SiteFooter } from "@/app/_components/SiteFooter";
import { getAllBlogSlugs, getBlogBySlug } from "@/lib/zh-blog-data";

export const metadata = {
  title: "中文创作者博客 | ToolEagle",
  description: "TikTok、YouTube、Instagram 涨粉、变现与内容策略的实战文章"
};

export default function ZhBlogIndexPage() {
  const slugs = getAllBlogSlugs().slice(0, 50);
  const blogs = slugs
    .map((slug) => {
      const data = getBlogBySlug(slug);
      if (!data) return null;
      return { slug, ...data };
    })
    .filter(Boolean) as { slug: string; entry: { keyword: string }; content: { title?: string } }[];

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1 container py-12">
        <h1 className="text-3xl font-semibold text-slate-900">中文创作者博客</h1>
        <p className="mt-2 text-slate-600">
          TikTok、YouTube、Instagram 涨粉、变现与内容策略的实战文章
        </p>
        <ul className="mt-8 space-y-3">
          {blogs.map((b) => (
            <li key={b.slug}>
              <Link
                href={`/zh/blog/${b.slug}`}
                className="text-sky-700 hover:text-sky-800 hover:underline"
              >
                {b.content.title || b.entry.keyword}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <SiteFooter />
    </main>
  );
}
