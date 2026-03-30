import Link from "next/link";

/** V171.2 — Blog mid-page workflow CTA (after main content, before tool CTA). */
export function StandardBlogMidWorkflowCta() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 space-y-4 not-prose">
      <p className="text-sm font-semibold text-slate-900">Try our tools</p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/creator"
          className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
        >
          Creator Mode →
        </Link>
        <Link
          href="/tools"
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          AI Tools →
        </Link>
        <Link
          href="/trending"
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Trending content →
        </Link>
        <Link
          href="/examples"
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Creator Examples →
        </Link>
      </div>
    </div>
  );
}
