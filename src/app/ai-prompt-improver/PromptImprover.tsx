"use client";

import { useState } from "react";
import { DelegatedButton } from "@/components/DelegatedButton";
import { safeCopyToClipboard } from "@/lib/clipboard";
import { trackEvent } from "@/lib/analytics";

export function PromptImprover() {
  const [input, setInput] = useState("");
  const [optimized, setOptimized] = useState("");
  const [whyItWorks, setWhyItWorks] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleImprove() {
    const trimmed = input.trim();
    if (!trimmed) return;

    setLoading(true);
    setError("");
    setOptimized("");
    setWhyItWorks("");

    try {
      const res = await fetch("/api/improve-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to improve prompt");
        return;
      }

      setOptimized(data.optimizedPrompt ?? "");
      setWhyItWorks(data.whyItWorks ?? "");
      trackEvent("prompt_improved", { tool_slug: "ai-prompt-improver" });
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!optimized) return;
    const ok = await safeCopyToClipboard(optimized);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      trackEvent("prompt_copied", { tool_slug: "ai-prompt-improver" });
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <div>
        <label htmlFor="prompt-input" className="block text-sm font-medium text-slate-700">
          Your rough prompt (any language)
        </label>
        <textarea
          id="prompt-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. 帮我写一个TikTok视频文案 / I want captions for my fitness video"
          rows={4}
          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/70"
        />
      </div>

      <DelegatedButton
        onClick={handleImprove}
        disabled={loading || !input.trim()}
        className="w-full rounded-xl bg-sky-600 px-5 py-3.5 text-base font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
      >
        {loading ? (
          <>
            <span className="inline-block h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
            Improving...
          </>
        ) : (
          "Improve my prompt"
        )}
      </DelegatedButton>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {optimized && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Optimized Prompt</h3>
            <DelegatedButton
              onClick={handleCopy}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              {copied ? "Copied!" : "Copy"}
            </DelegatedButton>
          </div>
          <pre className="text-sm text-slate-800 whitespace-pre-wrap font-sans">
            {optimized}
          </pre>
          {whyItWorks && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Why this prompt works</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{whyItWorks}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
