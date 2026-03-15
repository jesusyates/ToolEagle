"use client";

import { DelegatedButton } from "@/components/DelegatedButton";
import { safeCopyToClipboard } from "@/lib/clipboard";
import { useState } from "react";

export function ExamplesClient({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const ok = await safeCopyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <DelegatedButton
      onClick={handleCopy}
      className="mt-3 text-xs font-medium text-sky-600 hover:underline"
    >
      {copied ? "Copied!" : "Copy caption"}
    </DelegatedButton>
  );
}
