"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type ExampleHit = {
  slug: string | null;
  tool_name: string;
  tool_slug: string;
  result: string;
  creator_username: string | null;
};

export function SearchClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ExampleHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async () => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (query.trim()) search();
      else {
        setResults([]);
        setSearched(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, search]);

  return (
    <div className="max-w-2xl">
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search captions, hooks..."
          className="w-full rounded-xl border border-slate-200 px-4 py-3 pl-10 text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          autoFocus
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
      </div>

      {loading && (
        <p className="mt-4 text-sm text-slate-600">Searching...</p>
      )}

      {searched && !loading && (
        <div className="mt-6">
          <p className="text-sm text-slate-600 mb-4">
            {results.length} result{results.length !== 1 ? "s" : ""}
          </p>
          <ul className="space-y-3">
            {results.map((r, i) => (
              <li key={r.slug ?? i}>
                <Link
                  href={r.slug ? `/examples/${r.slug}` : "/examples"}
                  className="block rounded-xl border border-slate-200 p-4 hover:border-sky-300 hover:bg-sky-50/50 transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-sky-600">{r.tool_name}</span>
                    {r.creator_username && (
                      <span className="text-xs text-slate-500">@{r.creator_username}</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-slate-800 line-clamp-2">{r.result}</p>
                </Link>
              </li>
            ))}
          </ul>
          {results.length === 0 && query.trim() && (
            <p className="text-slate-600">No examples found. Try different keywords.</p>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-4">
        <Link href="/examples" className="text-sm font-medium text-sky-600 hover:underline">
          All examples →
        </Link>
        <Link href="/submit" className="text-sm font-medium text-sky-600 hover:underline">
          Submit your content →
        </Link>
      </div>
    </div>
  );
}
