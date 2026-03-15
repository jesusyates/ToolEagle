"use client";

import { useState } from "react";
import { DelegatedButton } from "@/components/DelegatedButton";
import { safeCopyToClipboard } from "@/lib/clipboard";
import { getRedditShareUrl } from "@/lib/share";
import { Share2 } from "lucide-react";

type PageShareButtonsProps = {
  /** Page URL (e.g. https://www.tooleagle.com/examples/xyz) */
  pageUrl: string;
  /** Reddit post title (e.g. "TikTok Caption Example - Creator content from ToolEagle") */
  redditTitle: string;
};

export function PageShareButtons({ pageUrl, redditTitle }: PageShareButtonsProps) {
  const [linkCopied, setLinkCopied] = useState(false);

  const redditUrl = getRedditShareUrl(pageUrl, redditTitle);

  async function handleCopyLink() {
    const ok = await safeCopyToClipboard(pageUrl);
    if (ok) {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  }

  const btnClass =
    "inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-slate-500">Share:</span>
      <DelegatedButton onClick={handleCopyLink} className={btnClass}>
        {linkCopied ? "Copied!" : "Copy link"}
      </DelegatedButton>
      <a href={redditUrl} target="_blank" rel="noopener noreferrer" className={btnClass}>
        <Share2 className="h-4 w-4" />
        Share to Reddit
      </a>
    </div>
  );
}
