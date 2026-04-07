import type { Metadata } from "next";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";
import { getAllZhGuides } from "@/lib/zh-guides-reader";

/** SSG: list built from `content/zh-guides` at build time. */
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "中文创作指南 | ToolEagle",
  description: "抖音、小红书等平台的中文实操指南与教程。"
};

export default async function ZhGuidesIndexPage() {
  const posts = await getAllZhGuides();

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1 container pt-10 pb-16 max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">中文创作指南</h1>
        <p className="mt-2 text-slate-600">面向创作者的中文指南与教程，随发布持续更新。</p>
        <nav className="mt-8" aria-label="中文指南文章">
          <ul className="space-y-4">
            {posts.map((p) => (
              <li key={p.slug}>
                <a
                  href={`/zh/guides/${encodeURIComponent(p.slug)}`}
                  className="text-lg font-medium text-sky-700 hover:underline"
                >
                  {p.title || p.slug}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        {posts.length === 0 ? <p className="mt-8 text-sm text-slate-500">暂无指南。</p> : null}
      </div>
      <SiteFooter />
    </main>
  );
}
