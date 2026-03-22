"use client";

/**
 * V86.1: Boost flow - Boost this page, Copy share content, Open distribution
 */

import { useState } from "react";
import Link from "next/link";
import { BoostModal } from "./BoostModal";

type Props = {
  slug: string;
  keyword: string;
  shareContent: {
    reddit: string;
    xThread: string;
    quora: string;
  };
};

export function BoostPageButton({ slug, keyword, shareContent }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-600"
        >
          Boost this page
        </button>
        <button
          type="button"
          onClick={() => copyToClipboard(shareContent.reddit, "Reddit")}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          {copied === "Reddit" ? "✓" : "Copy Reddit"}
        </button>
        <button
          type="button"
          onClick={() => copyToClipboard(shareContent.xThread, "X")}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          {copied === "X" ? "✓" : "Copy X"}
        </button>
        <button
          type="button"
          onClick={() => copyToClipboard(shareContent.quora, "Quora")}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          {copied === "Quora" ? "✓" : "Copy Quora"}
        </button>
        <Link
          href={`/dashboard/distribution/generate?keyword=${encodeURIComponent(keyword)}`}
          className="rounded-lg border border-sky-300 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800 hover:bg-sky-100"
        >
          Open distribution
        </Link>
      </div>
      {modalOpen && (
        <BoostModal
          slug={slug}
          keyword={keyword}
          shareContent={shareContent}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
