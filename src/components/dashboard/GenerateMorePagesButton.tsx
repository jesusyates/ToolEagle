"use client";

/**
 * V86.1: Generate more pages like this - for Money Keywords
 */

import Link from "next/link";

type Props = {
  keyword: string;
};

export function GenerateMorePagesButton({ keyword }: Props) {
  return (
    <Link
      href={`/dashboard/distribution/generate?keyword=${encodeURIComponent(keyword)}`}
      className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
    >
      Generate more pages like this →
    </Link>
  );
}
