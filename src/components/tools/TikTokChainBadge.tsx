"use client";

type Props = {
  compact?: boolean;
  copy?: string;
};

export function TikTokChainBadge({
  compact = true,
  copy = "Optimized as one TikTok content chain"
}: Props) {
  return (
    <div
      className={
        compact
          ? "inline-flex items-center rounded-md border border-sky-100 bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700"
          : "inline-flex items-center rounded-lg border border-sky-100 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700"
      }
    >
      {copy}
    </div>
  );
}

