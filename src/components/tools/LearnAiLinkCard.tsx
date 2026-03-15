import Link from "next/link";

/**
 * Internal link card for tool pages: "Learn to talk to AI better" → /learn-ai
 */
export function LearnAiLinkCard() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6 shadow-sm">
      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
        AI prompts
      </p>
      <p className="mt-2 text-sm text-slate-600">
        Learn to talk to AI better and write prompts that get better results.
      </p>
      <Link
        href="/learn-ai"
        className="mt-3 inline-block text-sm font-medium text-sky-600 hover:text-sky-700 hover:underline"
      >
        Learn to talk to AI better →
      </Link>
    </div>
  );
}
