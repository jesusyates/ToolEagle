/**
 * V79: "More answers about [topic]" block at bottom of pages.
 * 10–20 tightly related questions.
 */

import Link from "next/link";

export type AnswerIndexLink = {
  href: string;
  label: string;
};

type Props = {
  topic: string;
  links: AnswerIndexLink[];
  lang?: "zh" | "en";
};

export function AnswerIndexBlock({ topic, links, lang = "zh" }: Props) {
  const displayLinks = links.slice(0, 20);
  if (displayLinks.length === 0) return null;

  const title = lang === "zh" ? `更多关于「${topic}」的回答` : `More answers about ${topic}`;

  return (
    <section className="mt-12 rounded-xl border border-slate-200 bg-slate-50 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">{title}</h2>
      <ul className="space-y-2">
        {displayLinks.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sky-700 hover:text-sky-800 hover:underline text-sm"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
