"use client";

/**
 * V86.1: Clone this success - generate 5 similar pages, push to content pipeline
 */

import Link from "next/link";

type Props = {
  keyword: string;
  /** Optional: use for page-level clone */
  slug?: string;
};

export function CloneSuccessButton({ keyword, slug }: Props) {
  const distributionUrl = `/dashboard/distribution/generate?keyword=${encodeURIComponent(keyword)}`;
  return (
    <Link
      href={distributionUrl}
      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
    >
      Clone this success →
    </Link>
  );
}
