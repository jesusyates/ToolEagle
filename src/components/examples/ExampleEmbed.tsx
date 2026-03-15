"use client";

import { useState } from "react";
import { DelegatedButton } from "@/components/DelegatedButton";
import { safeCopyToClipboard } from "@/lib/clipboard";
import { Copy } from "lucide-react";

type ExampleEmbedProps = {
  /** Example content text */
  content: string;
  /** Page URL for cite attribute */
  pageUrl: string;
  /** Tool/example name for attribution */
  toolName: string;
  /** Optional creator username */
  creator?: string | null;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function ExampleEmbed({ content, pageUrl, toolName, creator }: ExampleEmbedProps) {
  const [copied, setCopied] = useState(false);

  const cite = creator ? `— @${creator} via ToolEagle` : `— ${toolName} | ToolEagle`;
  const escapedContent = escapeHtml(content).replace(/\n/g, "<br>\n  ");
  const escapedCite = escapeHtml(cite);

  const embedCode = `<blockquote cite="${escapeHtml(pageUrl)}">
  <p>${escapedContent}</p>
  <cite>${escapedCite}</cite>
</blockquote>`;

  async function handleCopy() {
    const ok = await safeCopyToClipboard(embedCode);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-slate-700">Embed this example</h3>
        <DelegatedButton
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
        >
          <Copy className="h-3.5 w-3.5" />
          {copied ? "Copied!" : "Copy embed"}
        </DelegatedButton>
      </div>
      <pre className="text-xs text-slate-600 overflow-x-auto whitespace-pre-wrap font-mono">
        {embedCode}
      </pre>
    </div>
  );
}
