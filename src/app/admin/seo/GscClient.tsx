"use client";

import { useEffect, useState } from "react";

type GscData = {
  connected: boolean;
  indexedPages?: number;
  topQueries?: { query: string; clicks: number; impressions: number }[];
  totalClicks?: number;
  totalImpressions?: number;
  error?: string;
};

export function GscClient() {
  const [data, setData] = useState<GscData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gsc")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ connected: false, error: "Failed to fetch" }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <p className="text-slate-600">Loading GSC data...</p>
      </div>
    );
  }

  if (!data?.connected) {
    return (
      <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-lg font-semibold text-slate-900">Google Search Console</h2>
        <p className="mt-2 text-sm text-slate-600">
          {data?.error ?? "Not connected. Add GSC_CLIENT_EMAIL and GSC_PRIVATE_KEY to enable."}
        </p>
        <ol className="mt-4 list-decimal list-inside space-y-2 text-sm text-slate-600">
          <li>Create a service account in Google Cloud Console</li>
          <li>Enable Search Console API</li>
          <li>Add service account as user in Search Console (read-only)</li>
          <li>Set GSC_CLIENT_EMAIL, GSC_PRIVATE_KEY, GSC_SITE_URL in env</li>
        </ol>
        <a
          href="https://search.google.com/search-console"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-sm font-medium text-sky-600 hover:underline"
        >
          Open Google Search Console →
        </a>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-lg font-semibold text-slate-900">Index & Performance</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.indexedPages != null && (
            <div>
              <p className="text-2xl font-semibold text-slate-900">{data.indexedPages.toLocaleString()}</p>
              <p className="text-sm text-slate-600">Indexed pages</p>
            </div>
          )}
          <div>
            <p className="text-2xl font-semibold text-slate-900">{(data.totalClicks ?? 0).toLocaleString()}</p>
            <p className="text-sm text-slate-600">Clicks (28d)</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900">{(data.totalImpressions ?? 0).toLocaleString()}</p>
            <p className="text-sm text-slate-600">Impressions (28d)</p>
          </div>
        </div>
      </div>

      {data.topQueries && data.topQueries.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-lg font-semibold text-slate-900">Top queries</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-2 text-left font-medium text-slate-700">Query</th>
                  <th className="py-2 text-right font-medium text-slate-700">Clicks</th>
                  <th className="py-2 text-right font-medium text-slate-700">Impressions</th>
                </tr>
              </thead>
              <tbody>
                {data.topQueries.map((q, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2 text-slate-800">{q.query || "(not set)"}</td>
                    <td className="py-2 text-right text-slate-600">{q.clicks}</td>
                    <td className="py-2 text-right text-slate-600">{q.impressions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
