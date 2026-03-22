/**
 * V89: Comparison Answer System - clear winner, pros/cons, recommendation.
 * For pages like TikTok vs YouTube, Free vs paid tools.
 */

import Link from "next/link";

export type ComparisonItem = {
  name: string;
  pros: string[];
  cons: string[];
};

type Props = {
  title: string;
  items: ComparisonItem[];
  /** Clear winner - which option to recommend */
  winner: string;
  /** Recommendation text */
  recommendation: string;
  /** Optional link to tool or page */
  href?: string;
  linkLabel?: string;
  lang?: "zh" | "en";
};

export function ComparisonAnswerBlock({
  title,
  items,
  winner,
  recommendation,
  href,
  linkLabel,
  lang = "en"
}: Props) {
  const winnerLabel = lang === "zh" ? "推荐选择" : "Our pick";
  const prosLabel = lang === "zh" ? "优点" : "Pros";
  const consLabel = lang === "zh" ? "缺点" : "Cons";

  return (
    <section className="mt-10 rounded-2xl border-2 border-amber-200 bg-amber-50/50 p-6" aria-label={title}>
      <h2 className="text-xl font-semibold text-slate-900 mb-4">{title}</h2>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.name} className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="font-semibold text-slate-900">{item.name}</h3>
            <div className="mt-2 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-emerald-700 uppercase">{prosLabel}</p>
                <ul className="mt-1 space-y-1 text-sm text-slate-700">
                  {item.pros.map((p, i) => (
                    <li key={i}>✓ {p}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-amber-700 uppercase">{consLabel}</p>
                <ul className="mt-1 space-y-1 text-sm text-slate-700">
                  {item.cons.map((c, i) => (
                    <li key={i}>✗ {c}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl border-2 border-amber-400 bg-amber-100/50 p-4">
        <p className="text-sm font-semibold text-amber-900">{winnerLabel}: {winner}</p>
        <p className="mt-2 text-sm text-slate-700">{recommendation}</p>
        {href && linkLabel && (
          <Link href={href} className="mt-3 inline-block text-sm font-medium text-sky-700 hover:text-sky-800 hover:underline">
            {linkLabel} →
          </Link>
        )}
      </div>
    </section>
  );
}
