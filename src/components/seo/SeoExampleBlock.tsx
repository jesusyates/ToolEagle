"use client";

import { useState } from "react";
import Link from "next/link";
import { DelegatedButton } from "@/components/DelegatedButton";
import { safeCopyToClipboard } from "@/lib/clipboard";
import { Copy, Sparkles } from "lucide-react";

type SeoExampleBlockProps = {
  examples: string[];
  topicLabel: string;
  platformLabel: string;
  typeLabel: string;
  toolSlug: string;
};

export function SeoExampleBlock({
  examples,
  topicLabel,
  platformLabel,
  typeLabel,
  toolSlug
}: SeoExampleBlockProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  async function handleCopy(text: string, index: number) {
    const ok = await safeCopyToClipboard(text);
    if (ok) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  }

  const typeLower = typeLabel.toLowerCase();

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold text-slate-900">
        20 {topicLabel} {platformLabel} {typeLabel} Examples
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Copy and use these {topicLabel.toLowerCase()} {typeLower} or customize for your content.
      </p>

      <ul className="mt-4 space-y-3">
        {examples.map((ex, i) => (
          <li
            key={i}
            className="group flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-sky-200 transition"
          >
            <span className="text-slate-800 flex-1 min-w-0">{ex}</span>
            <DelegatedButton
              onClick={() => handleCopy(ex, i)}
              className="shrink-0 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
            >
              <Copy className="h-3.5 w-3.5" />
              {copiedIndex === i ? "Copied!" : "Copy"}
            </DelegatedButton>
          </li>
        ))}
      </ul>

      <div className="mt-6 rounded-xl border-2 border-sky-200 bg-sky-50 p-4">
        <p className="text-sm font-medium text-slate-600">
          Need more options? Generate unlimited {topicLabel.toLowerCase()} {typeLower} with AI.
        </p>
        <Link
          href={`/tools/${toolSlug}`}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition"
        >
          <Sparkles className="h-4 w-4" />
          Generate More
        </Link>
      </div>
    </section>
  );
}
