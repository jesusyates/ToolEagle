/**
 * V77 AI Citation Domination: Direct Answer Block
 * 2–3 sentence clear answer, no fluff, directly answers the query.
 * Must be visible in first screen for AI search engines (ChatGPT, Perplexity, Google SGE).
 */

type Props = {
  /** Full direct answer text (2–3 sentences). */
  answer: string;
  /** Optional: for zh pages, use "zh" for Chinese styling. */
  lang?: "zh" | "en";
};

export function DirectAnswerBlock({ answer, lang = "zh" }: Props) {
  if (!answer?.trim()) return null;

  return (
    <section
      className="mt-6 rounded-xl border-2 border-sky-200 bg-sky-50 p-5"
      aria-label={lang === "zh" ? "精选摘要" : "Direct answer"}
    >
      <p className="text-base font-semibold text-slate-900 leading-relaxed whitespace-pre-line">
        {answer}
      </p>
    </section>
  );
}
