/**
 * v62: Homepage sections - 最新生成内容 + 热门关键词 (20 links each)
 */
import Link from "next/link";
import { getLatestKeywordPages, getPopularKeywordPages } from "@/lib/zh-keyword-data";

export function ZhHomepageKeywordSections() {
  const latest = getLatestKeywordPages(20);
  const popular = getPopularKeywordPages(20);

  if (latest.length === 0 && popular.length === 0) return null;

  return (
    <section className="container py-12 border-t border-slate-200">
      <div className="grid gap-10 sm:grid-cols-2">
        {latest.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              🔥 最新生成内容（Latest Keywords）
            </h2>
            <p className="mt-1 text-sm text-slate-600">最新 20 篇中文创作者指南</p>
            <ul className="mt-4 columns-2 gap-4 space-y-2">
              {latest.map((e) => (
                <li key={e.slug}>
                  <Link
                    href={`/zh/search/${e.slug}`}
                    className="text-sm text-sky-700 hover:text-sky-800 hover:underline"
                  >
                    {e.keyword}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/zh/recent" className="mt-3 inline-block text-sm text-sky-700 hover:underline">
              查看全部 →
            </Link>
          </div>
        )}
        {popular.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              🔥 热门关键词（Popular Keywords）
            </h2>
            <p className="mt-1 text-sm text-slate-600">涨粉、变现、做爆款等热门指南</p>
            <ul className="mt-4 columns-2 gap-4 space-y-2">
              {popular.map((e) => (
                <li key={e.slug}>
                  <Link
                    href={`/zh/search/${e.slug}`}
                    className="text-sm text-sky-700 hover:text-sky-800 hover:underline"
                  >
                    {e.keyword}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/zh/sitemap" className="mt-3 inline-block text-sm text-sky-700 hover:underline">
              完整站点地图 →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
