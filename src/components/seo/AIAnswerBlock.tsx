/**
 * V89: AI Citation Domination - Reusable snippet-optimized answer block.
 * Used for FAQ, direct answers, comparison answers.
 * Format: 2-3 sentences, clear structure, no fluff.
 * "Yes, you can... Most creators... Typically it takes..."
 */

import Link from "next/link";

export type AIAnswerBlockProps = {
  /** Question or label (e.g. "How long does it take?") */
  question: string;
  /** 2-3 sentence answer. Clear structure. */
  answer: string;
  /** Optional: link to related page. */
  href?: string;
  /** Optional: link label. */
  linkLabel?: string;
  /** Optional: authority/data statement (e.g. "Based on 100+ creators") */
  authority?: string;
  lang?: "zh" | "en";
};

export function AIAnswerBlock({ question, answer, href, linkLabel, authority, lang = "en" }: AIAnswerBlockProps) {
  return (
    <div
      className="rounded-xl border border-slate-200 bg-slate-50/80 p-4"
      itemScope
      itemType="https://schema.org/Question"
    >
      <h3 className="text-base font-semibold text-slate-900 mb-2" itemProp="name">
        {question}
      </h3>
      <p className="text-slate-700 leading-relaxed text-sm" itemProp="acceptedAnswer" itemScope itemType="https://schema.org/Answer">
        <span itemProp="text">{answer}</span>
      </p>
      {authority && (
        <p className="mt-2 text-xs text-slate-500 italic">
          {authority}
        </p>
      )}
      {href && linkLabel && (
        <Link
          href={href}
          className="mt-2 inline-block text-sm font-medium text-sky-700 hover:text-sky-800 hover:underline"
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

/** V89: Compact inline answer - for dense answer blocks */
export function AIAnswerInline({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-3">
      <p className="text-sm font-medium text-slate-900">{question}</p>
      <p className="mt-1 text-sm text-slate-700 leading-relaxed">{answer}</p>
    </div>
  );
}
