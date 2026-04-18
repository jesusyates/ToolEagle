import Link from "next/link";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";
import { getGuidesListPaginated, GUIDES_LIST_PAGE_SIZE } from "@/lib/guides-list-corpus";

/** Dynamic: list is only published `seo_articles` (created_at DESC, paginated). */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Creator Guides | ToolEagle",
  description:
    "Practical creator guides and tutorials—SEO-focused articles to help you publish better content faster."
};

type Props = { searchParams: Promise<{ page?: string }> };

/** Page numbers + optional ellipsis for long lists (same pattern as many CMS UIs). */
function buildPaginationItems(
  current: number,
  totalPages: number
): Array<{ type: "page"; n: number } | { type: "ellipsis" }> {
  if (totalPages <= 1) return [{ type: "page", n: 1 }];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => ({ type: "page" as const, n: i + 1 }));
  }
  const want = new Set<number>();
  want.add(1);
  want.add(totalPages);
  for (let p = current - 1; p <= current + 1; p++) {
    if (p >= 1 && p <= totalPages) want.add(p);
  }
  const sorted = [...want].sort((a, b) => a - b);
  const out: Array<{ type: "page"; n: number } | { type: "ellipsis" }> = [];
  for (let i = 0; i < sorted.length; i++) {
    const n = sorted[i]!;
    if (i > 0) {
      const prev = sorted[i - 1]!;
      if (n - prev > 1) out.push({ type: "ellipsis" });
    }
    out.push({ type: "page", n });
  }
  return out;
}

export default async function GuidesListPage({ searchParams }: Props) {
  const { page: pageRaw } = await searchParams;
  const requested = Math.max(1, parseInt(pageRaw ?? "1", 10) || 1);
  const { items: posts, page, total, totalPages } = await getGuidesListPaginated(
    requested,
    GUIDES_LIST_PAGE_SIZE
  );

  const prevHref = page > 1 ? `/guides?page=${page - 1}` : null;
  const nextHref = page < totalPages ? `/guides?page=${page + 1}` : null;

  return (
    <main className="min-h-screen bg-page text-slate-900 flex flex-col">
      <SiteHeader />
      <div className="flex-1">
        <section className="container pt-10 pb-16">
          <h1 className="text-3xl font-semibold tracking-tight">Creator Guides</h1>
          <p className="mt-2 text-sm text-slate-600">
            In-depth guides and tutorials for creators. Updated as we publish new topics.
          </p>
          {total > 0 ? (
            <p className="mt-2 text-xs text-slate-500">
              Showing {(page - 1) * GUIDES_LIST_PAGE_SIZE + 1}–
              {Math.min(page * GUIDES_LIST_PAGE_SIZE, total)} of {total} (page {page} of {totalPages}
              ).
            </p>
          ) : null}

          <nav className="mt-8" aria-label="Guide articles">
            <ul className="space-y-6">
              {posts.map((post) => (
                <li key={post.slug} className="rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    {post.coverImage ? (
                      <a
                        href={`/guides/${post.slug}`}
                        className="block shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 sm:mt-0.5"
                        aria-hidden tabIndex={-1}
                      >
                        <img
                          src={post.coverImage}
                          alt=""
                          className="h-24 w-full object-cover sm:h-20 sm:w-28"
                          loading="lazy"
                          decoding="async"
                        />
                      </a>
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <a
                        href={`/guides/${post.slug}`}
                        className="text-lg font-medium text-sky-700 hover:underline"
                      >
                        {post.title || post.slug}
                      </a>
                      <p className="mt-1 text-xs text-slate-500">{post.publishedAt}</p>
                      {post.description?.trim() ? (
                        <p className="mt-2 text-sm text-slate-600">{post.description.trim()}</p>
                      ) : null}
                      {post.hashtags.length > 0 ? (
                        <p className="mt-2 text-xs text-slate-500">{post.hashtags.join(" ")}</p>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </nav>
          {posts.length === 0 ? <p className="mt-8 text-sm text-slate-500">No guides yet.</p> : null}

          {totalPages > 1 ? (
            <nav
              className="mt-10 flex flex-wrap items-center justify-center gap-2 border-t border-slate-200 pt-8 sm:gap-3"
              aria-label="Guides pagination"
            >
              {prevHref ? (
                <Link
                  href={prevHref}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                >
                  Previous
                </Link>
              ) : (
                <span className="rounded-lg border border-transparent px-3 py-2 text-sm text-slate-400">
                  Previous
                </span>
              )}
              <ul className="flex flex-wrap items-center justify-center gap-1">
                {buildPaginationItems(page, totalPages).map((item, idx) =>
                  item.type === "ellipsis" ? (
                    <li key={`e-${idx}`} className="px-1 text-slate-400 select-none" aria-hidden>
                      …
                    </li>
                  ) : (
                    <li key={item.n}>
                      {item.n === page ? (
                        <span
                          className="inline-flex min-w-[2.25rem] items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-2 py-2 text-sm font-medium text-white"
                          aria-current="page"
                        >
                          {item.n}
                        </span>
                      ) : (
                        <Link
                          href={item.n === 1 ? "/guides" : `/guides?page=${item.n}`}
                          className="inline-flex min-w-[2.25rem] items-center justify-center rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                        >
                          {item.n}
                        </Link>
                      )}
                    </li>
                  )
                )}
              </ul>
              {nextHref ? (
                <Link
                  href={nextHref}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                >
                  Next
                </Link>
              ) : (
                <span className="rounded-lg border border-transparent px-3 py-2 text-sm text-slate-400">
                  Next
                </span>
              )}
            </nav>
          ) : null}
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
