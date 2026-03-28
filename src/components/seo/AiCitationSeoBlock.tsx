/**
 * V159 — English H2 + lists for AI-parseable summary (visible early on page).
 */
import {
  buildAiCitationBundleFromZhKeyword,
  buildStubCitationBundle,
  type ZhKeywordLike
} from "@/lib/seo/asset-seo-ai-citation-format";

type Props = {
  /** When set, builds from structured ZH row; otherwise stub from topic key. */
  zhRow?: ZhKeywordLike | null;
  topicKey: string;
  className?: string;
};

export function AiCitationSeoBlock({ zhRow, topicKey, className }: Props) {
  const bundle = zhRow ? buildAiCitationBundleFromZhKeyword(zhRow) : buildStubCitationBundle(topicKey);
  return (
    <section
      className={className ?? "mt-6 rounded-xl border border-slate-200 bg-slate-50/80 p-5"}
      aria-label="Structured summary for readers and retrieval"
      lang="en"
    >
      <h2 className="text-lg font-semibold text-slate-900">AI Quick Answer</h2>
      <p className="mt-2 text-slate-700 leading-relaxed text-[15px]">{bundle.short_answer}</p>

      <h2 className="text-lg font-semibold text-slate-900 mt-6">Key Takeaways</h2>
      <ul className="mt-2 list-disc pl-5 space-y-1.5 text-slate-700 text-[15px] leading-relaxed">
        {bundle.structured_bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>

      {bundle.step_by_step && bundle.step_by_step.length >= 2 ? (
        <>
          <h2 className="text-lg font-semibold text-slate-900 mt-6">Step-by-Step (summary)</h2>
          <ol className="mt-2 list-decimal pl-5 space-y-1.5 text-slate-700 text-[15px] leading-relaxed">
            {bundle.step_by_step.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </>
      ) : null}

      {bundle.faq_preview_lines && bundle.faq_preview_lines.length > 0 ? (
        <>
          <h2 className="text-lg font-semibold text-slate-900 mt-6">FAQ (outline)</h2>
          <ul className="mt-2 list-disc pl-5 space-y-1.5 text-slate-700 text-[15px] leading-relaxed">
            {bundle.faq_preview_lines.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
