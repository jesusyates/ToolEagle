"use client";

import Link from "next/link";
import { MessageSquareText, Zap, HelpCircle } from "lucide-react";

type RelatedExample = {
  slug: string;
  toolName: string;
  result: string;
  creatorUsername: string | null;
  href: string;
};

type RelatedAnswer = {
  slug: string;
  question: string;
  href: string;
};

type Props = {
  examples: RelatedExample[];
  answers: RelatedAnswer[];
  title?: string;
};

export function RelatedContentCard({ examples, answers, title = "Related Content" }: Props) {
  if (examples.length === 0 && answers.length === 0) return null;

  return (
    <section className="mt-10 rounded-xl border border-slate-200 bg-slate-50/50 p-6">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-4 space-y-4">
        {examples.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-slate-600 mb-2">Examples</h3>
            <ul className="space-y-2">
              {examples.slice(0, 4).map((ex) => (
                <li key={ex.slug}>
                  <Link
                    href={ex.href}
                    className="block rounded-lg border border-slate-200 bg-white px-3 py-2 hover:border-sky-300 transition"
                  >
                    <p className="text-sm text-slate-800 line-clamp-2">{ex.result}</p>
                    <span className="mt-1 text-xs text-slate-500">{ex.toolName}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {answers.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-slate-600 mb-2">Answers</h3>
            <ul className="space-y-2">
              {answers.slice(0, 3).map((a) => (
                <li key={a.slug}>
                  <Link
                    href={a.href}
                    className="block rounded-lg border border-slate-200 bg-white px-3 py-2 hover:border-sky-300 transition"
                  >
                    <p className="text-sm text-slate-800 line-clamp-2">{a.question}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/examples" className="text-sm font-medium text-sky-600 hover:underline">
          All Examples →
        </Link>
        <Link href="/answers" className="text-sm font-medium text-sky-600 hover:underline">
          Creator Answers →
        </Link>
      </div>
    </section>
  );
}
