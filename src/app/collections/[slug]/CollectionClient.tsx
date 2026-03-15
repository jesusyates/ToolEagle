"use client";

import { useState } from "react";
import Link from "next/link";
import { ToolCopyButton } from "@/components/tools/ToolCopyButton";
import { safeCopyToClipboard } from "@/lib/clipboard";

type Item = {
  id: string;
  item_type: string;
  example_slug: string | null;
  tool_slug: string | null;
  tool_name: string | null;
  content: string;
  created_at: string;
};

export function CollectionClient({
  collectionSlug,
  initialItems
}: {
  collectionSlug: string;
  initialItems: Item[];
}) {
  const [items, setItems] = useState(initialItems);

  async function handleRemove(saveId: string) {
    const res = await fetch(`/api/collections/${collectionSlug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ saveId, action: "remove" })
    });
    if (res.ok) setItems((i) => i.filter((x) => x.id !== saveId));
  }

  if (items.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50/50 p-12 text-center">
        <p className="text-slate-600 font-medium">This collection is empty</p>
        <p className="text-sm text-slate-500 mt-1">
          Add saved items from My Saved to this collection.
        </p>
        <Link
          href="/me/saved"
          className="mt-6 inline-flex rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700"
        >
          My Saved
        </Link>
      </div>
    );
  }

  return (
    <ul className="mt-8 space-y-4">
      {items.map((item) => (
        <li
          key={item.id}
          data-result-item
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition"
        >
          <p className="text-xs font-medium text-slate-500">
            {item.item_type} {item.tool_name && `· ${item.tool_name}`}
          </p>
          <p className="mt-2 text-sm text-slate-800 line-clamp-3" data-copy-source>
            {item.content}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <ToolCopyButton
              onClick={async () => { await safeCopyToClipboard(item.content); }}
              variant="primary"
              getTextToCopy={() => item.content}
            />
            {item.example_slug && (
              <Link href={`/examples/${item.example_slug}`} className="text-sm font-medium text-sky-600 hover:underline">
                View example
              </Link>
            )}
            {item.tool_slug && (
              <Link href={`/tools/${item.tool_slug}`} className="text-sm font-medium text-sky-600 hover:underline">
                Use tool
              </Link>
            )}
            <button
              onClick={() => handleRemove(item.id)}
              className="text-sm text-slate-500 hover:text-red-600"
            >
              Remove
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
