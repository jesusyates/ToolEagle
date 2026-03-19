"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ZhCopyButton } from "@/components/zh/ZhCopyButton";

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + "...";
}

type Item = {
  slug: string;
  keyword: string;
  title: string;
  oneLiner: string;
  pageUrl: string;
  embedUrl: string;
};

type BestKeyword = { keyword: string; views: number; clicks: number; generates: number };

type Props = {
  items: Item[];
};

export function DistributionClient({ items }: Props) {
  const [bestKeywords, setBestKeywords] = useState<BestKeyword[]>([]);

  useEffect(() => {
    fetch("/api/distribution/keywords")
      .then((r) => r.json())
      .then((d) => setBestKeywords(d.keywords ?? []))
      .catch(() => {});
  }, []);

  const todayPlan = [
    "Post 3 keywords",
    "Platforms: Reddit, X, Quora"
  ];

  return (
    <div className="mt-8 space-y-8">
      {/* Daily Posting Plan */}
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-5">
        <h3 className="font-semibold text-slate-900">Today&apos;s plan</h3>
        <ul className="mt-2 space-y-1 text-sm text-slate-700">
          {todayPlan.map((line, i) => (
            <li key={i}>• {line}</li>
          ))}
        </ul>
        <Link
          href="/dashboard/distribution/generate"
          className="mt-3 inline-block text-sm font-medium text-sky-700 hover:text-sky-800"
        >
          Generate content →
        </Link>
      </div>

      {/* Best Performing Keywords */}
      {bestKeywords.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold text-slate-900">Best performing keywords</h3>
          <p className="mt-1 text-sm text-slate-600">
            From revenue + tool usage. Use these for posting.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {bestKeywords.slice(0, 10).map((k) => (
              <Link
                key={k.keyword}
                href={`/dashboard/distribution/generate?keyword=${encodeURIComponent(k.keyword)}`}
                className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800"
              >
                {k.keyword}
                <span className="ml-1.5 text-xs text-slate-500">
                  ({k.clicks} clicks)
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Latest Keywords */}
      <div className="space-y-6">
      {items.map((item) => {
        const redditTitle = truncate(item.title, 300);
        const redditBody = `${item.oneLiner}\n\n来源：${item.pageUrl}`;
        const redditFull = `标题: ${redditTitle}\n\n正文:\n${redditBody}`;
        const xVersion = truncate(`${item.title}\n\n${item.oneLiner}\n\n${item.pageUrl}`, 280);
        const quoraVersion = `${item.title}\n\n${item.oneLiner}\n\n完整指南：${item.pageUrl}`;

        return (
          <div
            key={item.slug}
            className="rounded-xl border border-slate-200 bg-slate-50 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-slate-900">{item.keyword}</h3>
                <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                  {item.oneLiner || item.title}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link
                    href={`/zh/search/${item.slug}`}
                    className="text-xs text-sky-600 hover:underline"
                  >
                    页面
                  </Link>
                  <span className="text-slate-400">|</span>
                  <span className="text-xs text-slate-500 truncate max-w-[200px]" title={item.pageUrl}>
                    外链: {item.pageUrl}
                  </span>
                  <span className="text-slate-400">|</span>
                  <span className="text-xs text-slate-500 truncate max-w-[180px]" title={item.embedUrl}>
                    嵌入: {item.embedUrl}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <ZhCopyButton text={redditFull} label="Reddit" />
                <ZhCopyButton text={xVersion} label="X" />
                <ZhCopyButton text={quoraVersion} label="Quora" />
                <ZhCopyButton text={item.embedUrl} label="嵌入URL" />
              </div>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
