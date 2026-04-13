"use client";

import { useState } from "react";

export function AutoGenerateOneClient() {
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setOut(null);
    try {
      const r = await fetch("/api/admin/auto-generate-one", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: "{}"
      });
      const j = (await r.json()) as Record<string, unknown>;
      setOut(JSON.stringify(j, null, 2));
    } catch (e) {
      setOut(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-10 rounded-lg border border-slate-200 bg-slate-50/80 p-4">
      <h2 className="text-lg font-semibold text-slate-900">Auto-generate one (E2E)</h2>
      <p className="mt-1 text-sm text-slate-600">
        Generates one EN guide via DeepSeek, runs the SEO gate + auto-fix, then inserts into{" "}
        <code className="text-xs">seo_articles</code>. Single request — no batch loop.
      </p>
      <button
        type="button"
        disabled={loading}
        onClick={run}
        className="mt-3 rounded bg-sky-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? "Running…" : "Generate one & publish"}
      </button>
      {out ? (
        <pre className="mt-3 max-h-64 overflow-auto rounded border border-slate-200 bg-white p-3 text-xs text-slate-800">
          {out}
        </pre>
      ) : null}
    </div>
  );
}
