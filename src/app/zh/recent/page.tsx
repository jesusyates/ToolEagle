import Link from "next/link";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { SiteFooter } from "@/app/_components/SiteFooter";
import { getRecentZhPages } from "@/lib/zh-sitemap-data";

export const metadata = {
  title: "最新发布 | 中文创作者指南",
  description: "ToolEagle 最新发布的中文创作者指南，涵盖 TikTok、YouTube、Instagram 涨粉、内容策略、AI 提示词与爆款案例。"
};

export default function ZhRecentPage() {
  const recent = getRecentZhPages(100);

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SiteHeader />

      <div className="flex-1">
        <article className="container py-12">
          <div className="max-w-4xl">
            <nav className="text-sm text-slate-500 mb-6">
              <Link href="/" className="hover:text-slate-700">首页</Link>
              <span className="mx-2">/</span>
              <span className="text-slate-900">最新发布</span>
            </nav>

            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
              最新发布
            </h1>
            <p className="mt-4 text-slate-600">
              最新 {recent.length} 篇中文创作者指南
            </p>

            <ul className="mt-8 columns-2 sm:columns-3 gap-4 space-y-2">
              {recent.map((e, i) => (
                <li key={i}>
                  <Link
                    href={e.href}
                    className="text-sky-700 hover:text-sky-800 hover:underline"
                  >
                    {e.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <Link href="/zh/sitemap" className="text-sky-700 hover:underline">
                完整站点地图 →
              </Link>
            </div>
          </div>
        </article>
      </div>

      <SiteFooter />
    </main>
  );
}
