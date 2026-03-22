"use client";

/**
 * V86.1: Boost modal - share content, copy, suggestions
 */

import { useState } from "react";
import Link from "next/link";

const BOOST_SUGGESTIONS = [
  "Post this again",
  "Add 5 internal links",
  "Use stronger CTA"
];

type Props = {
  slug: string;
  keyword: string;
  shareContent: { reddit: string; xThread: string; quora: string };
  onClose: () => void;
};

export function BoostModal({ slug, keyword, shareContent, onClose }: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  };

  const copyAll = async () => {
    const all = `Reddit:\n${shareContent.reddit}\n\n---\n\nX:\n${shareContent.xThread}\n\n---\n\nQuora:\n${shareContent.quora}`;
    await copy(all, "All");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Boost this page</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-600">{slug} · {keyword}</p>

        <div className="mt-4 space-y-3">
          <p className="text-xs font-medium text-slate-600">Copy share content</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => copy(shareContent.reddit, "Reddit")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {copied === "Reddit" ? "✓ Copied" : "Reddit"}
            </button>
            <button
              type="button"
              onClick={() => copy(shareContent.xThread, "X")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {copied === "X" ? "✓ Copied" : "X"}
            </button>
            <button
              type="button"
              onClick={() => copy(shareContent.quora, "Quora")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {copied === "Quora" ? "✓ Copied" : "Quora"}
            </button>
            <button
              type="button"
              onClick={copyAll}
              className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
            >
              {copied === "All" ? "✓ Copied" : "Copy all"}
            </button>
          </div>
        </div>

        <div className="mt-4">
          <Link
            href={`/dashboard/distribution/generate?keyword=${encodeURIComponent(keyword)}`}
            className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
          >
            Open distribution →
          </Link>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-sm font-semibold text-slate-900">Suggestions</h4>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            {BOOST_SUGGESTIONS.map((s) => (
              <li key={s}>• {s}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
