/**
 * V77/V78 AI Citation: Direct Answer Block
 * V78: Upgraded to AI-dominant structured format.
 * - Opening summary sentence
 * - Numbered list (2–4 points)
 * - Optional time/result expectation
 */

import { parseStructuredAnswer, type StructuredAnswer } from "@/lib/direct-answer-format";

type Props = {
  /** Full direct answer text. Parsed for structured format if contains "1. Point" pattern. */
  answer: string;
  /** Optional: explicit structured format (overrides parsing). */
  structured?: StructuredAnswer;
  /** Optional: for zh pages, use "zh" for Chinese styling. */
  lang?: "zh" | "en";
};

export function DirectAnswerBlock({ answer, structured, lang = "zh" }: Props) {
  const resolved = structured ?? parseStructuredAnswer(answer);

  if (resolved && resolved.points.length >= 2) {
    return (
      <section
        className="mt-6 rounded-xl border-2 border-sky-200 bg-sky-50 p-5"
        aria-label={lang === "zh" ? "精选摘要" : "Direct answer"}
      >
        <div className="space-y-3">
          <p className="text-base font-semibold text-slate-900 leading-relaxed">
            {resolved.summary}
          </p>
          <ol className="ml-4 list-decimal space-y-1.5 text-slate-900 font-medium">
            {resolved.points.map((point, i) => (
              <li key={i} className="leading-relaxed">
                {point}
              </li>
            ))}
          </ol>
          {resolved.expectation && (
            <p className="text-sm text-slate-700 leading-relaxed pt-1">
              {resolved.expectation}
            </p>
          )}
        </div>
      </section>
    );
  }

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
