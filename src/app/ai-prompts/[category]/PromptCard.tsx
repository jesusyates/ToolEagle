"use client";

import { useState } from "react";
import { DelegatedButton } from "@/components/DelegatedButton";
import { safeCopyToClipboard } from "@/lib/clipboard";
import { trackEvent } from "@/lib/analytics";
import type { PromptItem } from "@/config/prompt-library";

export function PromptCard({ prompt }: { prompt: PromptItem }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const ok = await safeCopyToClipboard(prompt.prompt);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      trackEvent("prompt_copied", { tool_slug: "ai-prompts" });
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-900">{prompt.title}</h3>
          <p className="mt-1 text-sm text-slate-600">{prompt.description}</p>
          <pre className="mt-3 text-sm text-slate-700 whitespace-pre-wrap font-sans bg-slate-50 rounded-lg p-3">
            {prompt.prompt}
          </pre>
        </div>
        <DelegatedButton
          onClick={handleCopy}
          className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {copied ? "Copied!" : "Copy"}
        </DelegatedButton>
      </div>
    </div>
  );
}
