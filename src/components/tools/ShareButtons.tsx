"use client";

import { useState } from "react";
import { DelegatedButton } from "@/components/DelegatedButton";
import { useTranslations } from "next-intl";
import { safeCopyToClipboard } from "@/lib/clipboard";
import { getResultShareUrl, getTwitterShareUrl, getToolPlatform, PLATFORM_URLS } from "@/lib/share";

type ShareButtonsProps = {
  toolSlug: string;
  items: string[];
};

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  youtube: "YouTube",
  instagram: "Instagram"
};

const shareButtonClass =
  "inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-medium text-slate-800 hover:border-sky-500/80 hover:bg-gray-100 hover:text-sky-700 transition duration-150";

export function ShareButtons({ toolSlug, items }: ShareButtonsProps) {
  const t = useTranslations("common");
  const [linkCopied, setLinkCopied] = useState(false);

  const platform = getToolPlatform(toolSlug);
  const shareUrl = getResultShareUrl(toolSlug, items);
  const contentToCopy = items[0] ?? "";
  const twitterText = contentToCopy ? `${contentToCopy.slice(0, 150)}${contentToCopy.length > 150 ? "…" : ""}` : "";
  const twitterUrl = getTwitterShareUrl(twitterText, shareUrl);

  const platformShareUrl = platform ? PLATFORM_URLS[platform] : twitterUrl;
  const platformShareLabel = platform ? t("shareToPlatform", { platform: PLATFORM_LABELS[platform] ?? platform }) : t("shareToTwitter");

  async function handleCopyLink() {
    const ok = await safeCopyToClipboard(shareUrl);
    if (ok) {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <DelegatedButton onClick={handleCopyLink} className={shareButtonClass}>
        {linkCopied ? t("linkCopied") : t("shareLink")}
      </DelegatedButton>
      <a
        href={platformShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={shareButtonClass}
      >
        {platformShareLabel}
      </a>
    </div>
  );
}
