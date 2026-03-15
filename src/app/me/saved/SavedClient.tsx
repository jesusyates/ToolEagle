"use client";

import { useState } from "react";
import Link from "next/link";
import { ToolCopyButton } from "@/components/tools/ToolCopyButton";
import { safeCopyToClipboard } from "@/lib/clipboard";
import { Bookmark, Plus } from "lucide-react";

type Save = {
  id: string;
  item_type: string;
  example_slug: string | null;
  tool_slug: string | null;
  tool_name: string | null;
  content: string;
  created_at: string;
};

type Collection = {
  id: string;
  name: string;
  slug: string;
};

export function SavedClient({
  initialSaves,
  collections
}: {
  initialSaves: Save[];
  collections: Collection[];
}) {
  const [saves, setSaves] = useState(initialSaves);
  const [collectionList, setCollectionList] = useState(collections);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

  async function handleCreateCollection() {
    if (!newName.trim()) return;
    const res = await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() })
    });
    const data = await res.json();
    if (data.collection) {
      setCollectionList((c) => [data.collection, ...c]);
      setNewName("");
      setShowCreate(false);
    }
  }

  async function handleUnsave(id: string) {
    const res = await fetch(`/api/saves?id=${id}`, { method: "DELETE" });
    if (res.ok) setSaves((s) => s.filter((x) => x.id !== id));
  }

  async function handleUnsaveByExample(exampleSlug: string) {
    const res = await fetch(`/api/saves?exampleSlug=${exampleSlug}`, { method: "DELETE" });
    if (res.ok) setSaves((s) => s.filter((x) => x.example_slug !== exampleSlug));
  }

  if (saves.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50/50 p-12 text-center">
        <Bookmark className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-600 font-medium">No saves yet</p>
        <p className="text-sm text-slate-500 mt-1">
          Save captions, hooks, and examples from the Discover page or example pages.
        </p>
        <Link
          href="/discover"
          className="mt-6 inline-flex rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700"
        >
          Discover content
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Collections</h2>
        <div className="mt-2 flex flex-wrap gap-2 items-center">
          {collectionList.map((c) => (
              <Link
                key={c.id}
                href={`/collections/${c.slug}`}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-sky-300 hover:text-sky-700"
              >
                {c.name}
              </Link>
            ))}
          {showCreate ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Collection name"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleCreateCollection()}
              />
              <button
                onClick={handleCreateCollection}
                className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700"
              >
                Create
              </button>
              <button
                onClick={() => { setShowCreate(false); setNewName(""); }}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 hover:border-sky-300 hover:text-sky-600"
            >
              <Plus className="h-4 w-4" />
              New collection
            </button>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">All saved</h2>
        <ul className="mt-4 space-y-4">
          {saves.map((save) => (
            <li
              key={save.id}
              data-result-item
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-500">
                    {save.item_type} {save.tool_name && `· ${save.tool_name}`}
                  </p>
                  <p className="mt-2 text-sm text-slate-800 line-clamp-3" data-copy-source>
                    {save.content}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <ToolCopyButton
                    onClick={async () => { await safeCopyToClipboard(save.content); }}
                    variant="primary"
                    getTextToCopy={() => save.content}
                  />
                  {save.example_slug && (
                    <Link
                      href={`/examples/${save.example_slug}`}
                      className="text-sm font-medium text-sky-600 hover:underline"
                    >
                      View
                    </Link>
                  )}
                  {save.tool_slug && (
                    <Link
                      href={`/tools/${save.tool_slug}`}
                      className="text-sm font-medium text-sky-600 hover:underline"
                    >
                      Tool
                    </Link>
                  )}
                  <button
                    onClick={() =>
                      save.example_slug ? handleUnsaveByExample(save.example_slug) : handleUnsave(save.id)
                    }
                    className="text-sm text-slate-500 hover:text-red-600"
                    title="Remove"
                  >
                    <Bookmark className="h-4 w-4 fill-current" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
