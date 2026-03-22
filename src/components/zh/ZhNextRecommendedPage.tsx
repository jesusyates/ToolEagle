"use client";

/**
 * V85: Lightweight "next recommended page" block
 */

import Link from "next/link";

type Props = {
  href: string;
  label: string;
  description?: string;
};

export function ZhNextRecommendedPage({ href, label, description }: Props) {
  return (
    <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50/80 p-4" aria-label="推荐阅读">
      <p className="text-xs font-medium text-amber-800">推荐继续阅读</p>
      <Link href={href} className="mt-1 block font-semibold text-slate-900 hover:text-sky-600 hover:underline">
        {label} →
      </Link>
      {description && <p className="mt-0.5 text-xs text-slate-600">{description}</p>}
    </section>
  );
}
