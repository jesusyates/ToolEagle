/**
 * V89: Multi-Question Expansion - 5-10 related questions per page.
 * Links question → answer page for internal answer network.
 */

import Link from "next/link";

export type MultiQuestionLink = {
  question: string;
  href: string;
  label: string;
};

type Props = {
  questions: MultiQuestionLink[];
  lang?: "zh" | "en";
};

export function MultiQuestionBlock({ questions, lang = "en" }: Props) {
  const display = questions.slice(0, 10);
  if (display.length === 0) return null;

  const title = lang === "zh" ? "相关问题" : "Related Questions";
  const sub = lang === "zh" ? "点击查看完整答案" : "Click for full answer";

  return (
    <section className="mt-10 rounded-xl border-2 border-sky-200 bg-sky-50/50 p-6" aria-label={title}>
      <h2 className="text-lg font-semibold text-slate-900 mb-1">{title}</h2>
      <p className="text-sm text-slate-600 mb-4">{sub}</p>
      <ul className="space-y-3">
        {display.map((q) => (
          <li key={q.href + q.question}>
            <Link
              href={q.href}
              className="block rounded-lg border border-slate-200 bg-white p-3 hover:border-sky-300 hover:bg-sky-50/50 transition"
            >
              <span className="text-sm font-medium text-slate-900">{q.question}</span>
              <span className="block text-xs text-sky-700 mt-1">{q.label} →</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
