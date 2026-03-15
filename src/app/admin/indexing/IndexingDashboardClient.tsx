"use client";

import { useEffect, useState } from "react";

type IndexingData = {
  totalPages: number;
  indexedPages: number;
  nonIndexedPages: number | null;
  latestCrawled: string[];
  error?: string;
};

export function IndexingDashboardClient() {
  const [data, setData] = useState<IndexingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitUrl, setSubmitUrl] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    fetch("/api/indexing")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmitUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!submitUrl.trim()) return;
    setSubmitStatus("loading");
    setSubmitError("");

    try {
      const res = await fetch("/api/indexing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: submitUrl.trim() })
      });
      const json = await res.json();

      if (!res.ok) {
        setSubmitError(json.error ?? "Failed");
        setSubmitStatus("error");
        return;
      }

      setSubmitStatus("success");
      setSubmitUrl("");
    } catch {
      setSubmitError("Failed");
      setSubmitStatus("error");
    }
  }

  if (loading) {
    return (
      <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <p className="text-slate-600">Loading indexing data...</p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-lg font-semibold text-slate-900">Index status</h2>
        {data?.error && (
          <p className="mt-2 text-sm text-amber-700">{data.error}</p>
        )}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-2xl font-semibold text-slate-900">{data?.totalPages?.toLocaleString() ?? "—"}</p>
            <p className="text-sm text-slate-600">Total pages</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900">
              {data?.indexedPages?.toLocaleString() ?? "—"}
            </p>
            <p className="text-sm text-slate-600">Indexed pages</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900">
              {data?.nonIndexedPages != null ? data.nonIndexedPages.toLocaleString() : "—"}
            </p>
            <p className="text-sm text-slate-600">Non-indexed</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-lg font-semibold text-slate-900">Manual submit URL</h2>
        <p className="mt-2 text-sm text-slate-600">
          Submit a URL to the Google Indexing API for faster crawling. Requires Indexing API enabled and service account with indexing scope.
        </p>
        <form onSubmit={handleSubmitUrl} className="mt-4 flex gap-2">
          <input
            type="url"
            value={submitUrl}
            onChange={(e) => setSubmitUrl(e.target.value)}
            placeholder="https://www.tooleagle.com/examples/..."
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          <button
            type="submit"
            disabled={submitStatus === "loading" || !submitUrl.trim()}
            className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {submitStatus === "loading" ? "Submitting..." : "Submit"}
          </button>
        </form>
        {submitStatus === "success" && (
          <p className="mt-2 text-sm text-emerald-600">URL submitted successfully.</p>
        )}
        {submitStatus === "error" && (
          <p className="mt-2 text-sm text-red-600">{submitError}</p>
        )}
      </div>

      <a
        href="https://search.google.com/search-console"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-sm font-medium text-sky-600 hover:underline"
      >
        Open Google Search Console →
      </a>
    </div>
  );
}
