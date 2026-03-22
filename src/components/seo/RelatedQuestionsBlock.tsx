/**
 * V79: "Related Questions" block - 10–20 links for AI crawling.
 */

import Link from "next/link";

export type RelatedQuestionLink = {
  href: string;
  label: string;
};

type Props = {
  links: RelatedQuestionLink[];
  lang?: "zh" | "en";
};

export function RelatedQuestionsBlock({ links, lang = "zh" }: Props) {
  const displayLinks = links.slice(0, 20);
  if (displayLinks.length === 0) return null;

  const title = lang === "zh" ? "相关问题" : "Related Questions";

  return (
    <section className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-5">
      <h2 className="text-base font-semibold text-slate-900 mb-3">{title}</h2>
      <ul className="space-y-2 columns-1 sm:columns-2 gap-4">
        {displayLinks.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sky-700 hover:text-sky-800 hover:underline text-sm block"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
