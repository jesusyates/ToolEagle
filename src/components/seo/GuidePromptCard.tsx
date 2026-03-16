"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { safeCopyToClipboard } from "@/lib/clipboard";

type Props = {
  prompt: string;
  example?: string;
  topicSlug: string;
  index: number;
};

export function GuidePromptCard({ prompt, example, topicSlug, index }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const ok = await safeCopyToClipboard(prompt);
    if (ok) {
      setCopied(true);
      trackEvent("prompt_copied", { topic_slug: topicSlug });
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 transition">
      <p className="text-sm text-slate-800 leading-relaxed">{prompt}</p>
      {example && (
        <p className="mt-2 text-xs text-slate-500 italic">Example: &quot;{example}&quot;</p>
      )}
      <button
        type="button"
        onClick={handleCopy}
        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 transition"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
