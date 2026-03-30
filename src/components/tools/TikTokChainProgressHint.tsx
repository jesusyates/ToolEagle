"use client";

import chainTop1 from "@/config/v195-chain-top1-fix.json";

const CHAIN = [
  "hook-generator",
  "tiktok-caption-generator",
  "hashtag-generator",
  "title-generator"
] as const;

function stepOf(toolSlug: string): number {
  const i = CHAIN.indexOf(toolSlug as (typeof CHAIN)[number]);
  return i >= 0 ? i + 1 : 0;
}

type Props = {
  toolSlug: string;
};

export function TikTokChainProgressHint({ toolSlug }: Props) {
  const step = stepOf(toolSlug);
  if (!step) return null;
  const emphasized =
    chainTop1.mode === "hook_entry_visibility" && chainTop1.progressHint?.variant === "emphasized";
  const boxClass = emphasized
    ? "mb-3 inline-flex items-center rounded-lg border-2 border-violet-300 bg-violet-50/90 px-3 py-1.5 text-[11px] font-semibold text-violet-900 shadow-sm"
    : "mb-3 inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700";
  return <div className={boxClass}>{`Step ${step} of 4 · Build your TikTok content chain`}</div>;
}

