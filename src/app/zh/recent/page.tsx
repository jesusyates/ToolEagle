import Link from "next/link";
import { getRecentZhPagesWithKeywords } from "@/lib/zh-sitemap-data";
import { ZhRelatedRecommendations } from "@/components/zh/ZhRelatedRecommendations";
import { getZhPageMetadata } from "@/lib/zh-metadata";
import { BASE_URL } from "@/config/site";

export const metadata = getZhPageMetadata("最新发布", `${BASE_URL}/zh/recent`);

const PER_PAGE = 30;

type Props = { searchParams: Promise<{ page?: string }> };

export default async function ZhRecentPage({ searchParams }: Props) {
  const { page } = await searchParams;
  const pageNum = Math.max(1, parseInt(page ?? "1", 10) || 1);
  const all = getRecentZhPagesWithKeywords(100);
  const total = all.length;
  const totalPages = Math.ceil(total / PER_PAGE);
  const currentPage = Math.min(pageNum, totalPages);
  const start = (currentPage - 1) * PER_PAGE;
  const recent = all.slice(start, start + PER_PAGE);

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">

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
              最新 {total} 篇中文创作者指南（第 {currentPage}/{totalPages || 1} 页）
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

            <ZhRelatedRecommendations limit={15} />

            {totalPages > 1 && (
              <nav className="mt-8 flex flex-wrap gap-2" aria-label="分页">
                {currentPage > 1 && (
                  <Link
                    href={`/zh/recent?page=${currentPage - 1}`}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    上一页
                  </Link>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                  .map((p, i, arr) => (
                    <span key={p}>
                      {i > 0 && arr[i - 1] !== p - 1 && (
                        <span className="px-2 text-slate-400">…</span>
                      )}
                      {p === currentPage ? (
                        <span className="rounded-lg border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700">
                          {p}
                        </span>
                      ) : (
                        <Link
                          href={`/zh/recent?page=${p}`}
                          className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          {p}
                        </Link>
                      )}
                    </span>
                  ))}
                {currentPage < totalPages && (
                  <Link
                    href={`/zh/recent?page=${currentPage + 1}`}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    下一页
                  </Link>
                )}
              </nav>
            )}

            <div className="mt-10">
              <Link href="/zh/sitemap" className="text-sky-700 hover:underline">
                完整站点地图 →
              </Link>
            </div>
          </div>
        </article>
      </div>

    </main>
  );
}
