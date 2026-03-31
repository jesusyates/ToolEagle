import Link from "next/link";
import { getAllBlogSlugs, getBlogBySlug } from "@/lib/zh-blog-data";

import { zhSeoTitle } from "@/config/zh-brand";

export const metadata = {
  title: { absolute: zhSeoTitle("创作者博客") },
  description: "面向中国创作者的实战文章：抖音运营、短视频文案、增长与变现（非英文站镜像）。"
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
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <div className="flex-1 container py-12">
        <h1 className="text-3xl font-semibold text-slate-900">中文创作者博客</h1>
        <p className="mt-2 text-slate-600">抖音与短视频创作向实战文章；全球向内容请访问英文主站。</p>
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
    </main>
  );
}
