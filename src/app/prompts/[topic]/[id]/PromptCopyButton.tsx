"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

type Props = { content: string; topic: string; id: string };

export function PromptCopyButton({ content, topic, id }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      trackEvent("prompt_copy", { topic_slug: topic, prompt_id: id });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="absolute top-3 right-3 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition flex items-center gap-1.5"
    >
      <Copy className="h-3.5 w-3.5" />
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
