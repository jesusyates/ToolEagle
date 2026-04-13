"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { History } from "lucide-react";
import { ZH } from "@/lib/zh-site/paths";
import { fetchSharedCoreHistory, type HistoryRowUi } from "@/lib/web/web-task-client";
import { isEnDashboardAllowedToolSlug } from "@/lib/en-dashboard-scope";
import { isZhDashboardDouyinSlug, zhDashboardToolDisplayName, zhDashboardToolHref } from "@/lib/zh-dashboard-scope";

export function DashboardHistoryFromCore({ variant }: { variant: "en" | "zh" }) {
  const [history, setHistory] = useState<HistoryRowUi[] | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const rows = await fetchSharedCoreHistory();
        if (cancelled) return;
        const filtered =
          variant === "en"
            ? rows.filter((r) => isEnDashboardAllowedToolSlug(r.toolSlug))
            : rows.filter((r) => isZhDashboardDouyinSlug(r.toolSlug));
        setHistory(filtered);
      } catch {
        if (!cancelled) {
          setErr(true);
          setHistory([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [variant]);

  if (history === null) {
    return (
      <section className="container pt-10 pb-16">
        <p className="text-sm text-slate-500">{variant === "zh" ? "加载中…" : "Loading…"}</p>
      </section>
    );
  }

  if (err) {
    return (
      <section className="container pt-10 pb-16">
        <p className="text-sm text-rose-600">{variant === "zh" ? "加载失败，请刷新。" : "Could not load history. Refresh to try again."}</p>
      </section>
    );
  }

  if (variant === "zh") {
    return (
      <section className="container pt-10 pb-16">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link href={ZH.dashboard} className="text-sm font-medium text-sky-600 hover:text-sky-800">
              ← 返回工作台
            </Link>
            <div className="flex items-center gap-2 mt-2">
              <History className="h-6 w-6 text-slate-500" />
              <h1 className="text-2xl font-semibold text-slate-900">生成记录</h1>
            </div>
            <p className="mt-1 text-sm text-slate-600">你在抖音专栏工具中的最近生成。</p>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50/50 p-12 text-center">
            <p className="text-slate-600 font-medium">暂无记录</p>
            <p className="mt-1 text-sm text-slate-500">
              在抖音专栏工具中生成内容后即可在此查看；英文站工具的记录不会出现在此列表。
            </p>
            <Link
              href={ZH.douyin}
              className="mt-4 inline-flex rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
            >
              浏览抖音专栏
            </Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
            {history.map((h) => (
              <li
                key={h.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-500">
                      {zhDashboardToolDisplayName(h.toolSlug, h.toolName)} ·{" "}
                      {new Date(h.createdAt).toLocaleString()}
                    </p>
                    <p className="mt-1 text-sm text-slate-700 line-clamp-2">{h.input}</p>
                    {h.items.length > 0 && (
                      <p className="mt-2 text-xs text-slate-500 line-clamp-1">
                        {h.items[0]}
                        {h.items.length > 1 ? `（另有 ${h.items.length - 1} 条）` : ""}
                      </p>
                    )}
                  </div>
                  <Link
                    href={zhDashboardToolHref(h.toolSlug)}
                    className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    再次使用
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  return (
    <section className="container pt-10 pb-16">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/dashboard" className="text-sm font-medium text-sky-600 hover:text-sky-800">
            ← Dashboard
          </Link>
          <div className="flex items-center gap-2 mt-2">
            <History className="h-6 w-6 text-slate-500" />
            <h1 className="text-2xl font-semibold text-slate-900">Generation History</h1>
          </div>
          <p className="mt-1 text-sm text-slate-600">Your recent AI generations across all tools.</p>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50/50 p-12 text-center">
          <p className="text-slate-600 font-medium">No history yet</p>
          <p className="mt-1 text-sm text-slate-500">Generate content with any tool to see it here.</p>
          <Link
            href="/tools"
            className="mt-4 inline-flex rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
          >
            Browse tools
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {history.map((h) => (
            <li
              key={h.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-500">
                    {h.toolName} · {new Date(h.createdAt).toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm text-slate-700 line-clamp-2">{h.input}</p>
                  {h.items.length > 0 && (
                    <p className="mt-2 text-xs text-slate-500 line-clamp-1">
                      {h.items[0]}
                      {h.items.length > 1 ? ` (+${h.items.length - 1} more)` : ""}
                    </p>
                  )}
                </div>
                <Link
                  href={`/tools/${h.toolSlug}`}
                  className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Use again
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
