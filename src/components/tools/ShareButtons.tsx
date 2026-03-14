"use client";

import { useState } from "react";
import { getResultShareUrl, getTwitterShareUrl } from "@/lib/share";

type ShareButtonsProps = {
  toolSlug: string;
  items: string[];
};

export function ShareButtons({ toolSlug, items }: ShareButtonsProps) {
  const [linkCopied, setLinkCopied] = useState(false);

  const shareUrl = getResultShareUrl(toolSlug, items);
  const twitterText = items[0] ? `${items[0].slice(0, 150)}${items[0].length > 150 ? "…" : ""}` : "";
  const twitterUrl = getTwitterShareUrl(twitterText, shareUrl);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // no feedback on error
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={handleCopyLink}
        className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-medium text-slate-800 hover:border-sky-500/80 hover:bg-gray-100 hover:text-sky-700 transition duration-150"
      >
        {linkCopied ? "Link copied ✓" : "Share link"}
      </button>
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-medium text-slate-800 hover:border-sky-500/80 hover:bg-gray-100 hover:text-sky-700 transition duration-150"
      >
        Share to Twitter
      </a>
    </div>
  );
}
