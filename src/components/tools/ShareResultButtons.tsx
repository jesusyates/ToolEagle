"use client";

import { useState } from "react";
import { DelegatedButton } from "@/components/DelegatedButton";
import { safeCopyToClipboard } from "@/lib/clipboard";
import { getResultShareUrl, getTwitterShareUrl, getToolPlatform, PLATFORM_URLS } from "@/lib/share";

type ShareResultButtonsProps = {
  toolSlug: string;
  items: string[];
};

export function ShareResultButtons({ toolSlug, items }: ShareResultButtonsProps) {
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const platform = getToolPlatform(toolSlug);
  const shareUrl = getResultShareUrl(toolSlug, items);
  const caption = items[0] ?? "";
  const twitterText = caption ? `${caption.slice(0, 150)}${caption.length > 150 ? "…" : ""}` : "";
  const twitterUrl = getTwitterShareUrl(twitterText, shareUrl);

  async function handleCopyCaption() {
    const ok = await safeCopyToClipboard(caption);
    if (ok) {
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
    }
  }

  async function handleCopyLink() {
    const ok = await safeCopyToClipboard(shareUrl);
    if (ok) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }

  const btnClass =
    "inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:border-sky-500/80 hover:bg-slate-50 hover:text-sky-700 transition duration-150";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <DelegatedButton onClick={handleCopyCaption} className={btnClass}>
        {copiedCaption ? "Copied!" : "Copy caption"}
      </DelegatedButton>
      <DelegatedButton onClick={handleCopyLink} className={btnClass}>
        {copiedLink ? "Copied!" : "Copy link"}
      </DelegatedButton>
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={btnClass}
      >
        Share to Twitter
      </a>
      {platform === "tiktok" && (
        <a
          href={PLATFORM_URLS.tiktok}
          target="_blank"
          rel="noopener noreferrer"
          className={btnClass}
        >
          Share to TikTok
        </a>
      )}
      {platform === "instagram" && (
        <a
          href={PLATFORM_URLS.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className={btnClass}
        >
          Share to Instagram
        </a>
      )}
      {platform === "youtube" && (
        <a
          href={PLATFORM_URLS.youtube}
          target="_blank"
          rel="noopener noreferrer"
          className={btnClass}
        >
          Share to YouTube
        </a>
      )}
    </div>
  );
}
