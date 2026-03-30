"use client";

import Link from "next/link";

type Props = {
  href: string;
  /** e.g. "Fix your hook (…)" */
  ctaLabel: string;
  /** Problem copy — matches primary issue */
  problemTitle: string;
  problemDetail?: string;
};

export function CreatorNextActionCard({ href, ctaLabel, problemTitle, problemDetail }: Props) {
  return (
    <div className="relative rounded-2xl border-2 border-sky-400 bg-gradient-to-b from-sky-100 to-sky-50 px-5 py-6 shadow-xl ring-4 ring-sky-500/25">
      <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-sky-950">Do this next</p>
      <p className="mt-3 text-center text-base font-semibold leading-snug text-slate-900">{problemTitle}</p>
      {problemDetail ? (
        <p className="mt-2 text-center text-sm leading-relaxed text-slate-600 line-clamp-4">{problemDetail}</p>
      ) : null}
      <Link
        href={href}
        className="mt-6 flex w-full items-center justify-center rounded-2xl bg-sky-600 px-4 py-4 text-center text-base font-bold text-white shadow-lg hover:bg-sky-500 active:scale-[0.99]"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
