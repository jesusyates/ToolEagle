"use client";

import { useState } from "react";
import Link from "next/link";
import { SaveButton } from "@/components/save/SaveButton";
import { ToolCopyButton } from "@/components/tools/ToolCopyButton";
import { safeCopyToClipboard } from "@/lib/clipboard";

type Item = {
  slug: string;
  toolName: string;
  toolSlug: string;
  result: string;
  creatorUsername: string | null;
  createdAt: string;
};

export function DiscoverClient({
  initialItems,
  initialPage,
  hasMore,
  initialSort = "latest"
}: {
  initialItems: Item[];
  initialPage: number;
  hasMore: boolean;
  initialSort?: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(initialPage);
  const [sort, setSort] = useState(initialSort);
  const [loading, setLoading] = useState(false);
  const [moreItems, setMoreItems] = useState<Item[]>([]);
  const [moreHasMore, setMoreHasMore] = useState(hasMore);

  async function loadMore() {
    if (loading || !moreHasMore) return;
    setLoading(true);
    const nextPage = page + 1;
    const res = await fetch(`/api/discover?page=${nextPage}&sort=${sort}`);
    const data = await res.json();
    setMoreItems((m) => [...m, ...(data.items ?? [])]);
    setMoreHasMore(data.hasMore ?? false);
    setPage(nextPage);
    setLoading(false);
  }

  const allItems = [...items, ...moreItems];

  if (allItems.length === 0) {
    return (
      <section className="container py-12">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center">
          <p className="text-slate-600 font-medium">No content yet</p>
          <p className="text-sm text-slate-500 mt-1">
            Be the first to submit an example.
          </p>
          <Link
            href="/submit"
            className="mt-6 inline-flex rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700"
          >
            Submit example
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="container py-12">
      <div className="mb-6 flex gap-2">
        {(["latest", "trending", "popular"] as const).map((s) => (
          <a
            key={s}
            href={`/discover?sort=${s}`}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              sort === s
                ? "bg-sky-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </a>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allItems.map((item) => (
          <div
            key={item.slug}
            data-result-item
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-xs font-medium text-sky-600">{item.toolName}</span>
              <SaveButton
                exampleSlug={item.slug}
                content={item.result}
                variant="icon"
              />
            </div>
            <Link href={`/examples/${item.slug}`} className="block">
              <p className="text-sm text-slate-800 line-clamp-3" data-copy-source>
                {item.result}
              </p>
            </Link>
            {item.creatorUsername && (
              <Link
                href={`/creators/${item.creatorUsername}`}
                className="mt-2 inline-block text-xs text-slate-500 hover:text-sky-600"
              >
                @{item.creatorUsername}
              </Link>
            )}
            <div className="mt-3 flex items-center gap-2">
              <ToolCopyButton
                onClick={async () => { await safeCopyToClipboard(item.result); }}
                variant="primary"
                getTextToCopy={() => item.result}
              />
              <Link
                href={`/examples/${item.slug}`}
                className="text-sm font-medium text-sky-600 hover:underline"
              >
                View
              </Link>
            </div>
          </div>
        ))}
      </div>

      {moreHasMore && (
        <div className="mt-10 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="rounded-xl bg-slate-100 px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </section>
  );
}
