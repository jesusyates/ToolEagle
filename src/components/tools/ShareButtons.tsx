"use client";

import { useState } from "react";
import { DelegatedButton } from "@/components/DelegatedButton";
import { useTranslations } from "next-intl";
import { safeCopyToClipboard } from "@/lib/clipboard";
import { getResultShareUrl, getTwitterShareUrl } from "@/lib/share";

type ShareButtonsProps = {
  toolSlug: string;
  items: string[];
};

export function ShareButtons({ toolSlug, items }: ShareButtonsProps) {
  const t = useTranslations("common");
  const [linkCopied, setLinkCopied] = useState(false);

  const shareUrl = getResultShareUrl(toolSlug, items);
  const twitterText = items[0] ? `${items[0].slice(0, 150)}${items[0].length > 150 ? "…" : ""}` : "";
  const twitterUrl = getTwitterShareUrl(twitterText, shareUrl);

  async function handleCopyLink() {
    const ok = await safeCopyToClipboard(shareUrl);
    if (ok) {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <DelegatedButton
        onClick={handleCopyLink}
        className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-medium text-slate-800 hover:border-sky-500/80 hover:bg-gray-100 hover:text-sky-700 transition duration-150"
      >
        {linkCopied ? t("linkCopied") : t("shareLink")}
      </DelegatedButton>
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-medium text-slate-800 hover:border-sky-500/80 hover:bg-gray-100 hover:text-sky-700 transition duration-150"
      >
        {t("shareToTwitter")}
      </a>
    </div>
  );
}
