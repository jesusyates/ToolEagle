"use client";

import { useState } from "react";
import { DelegatedButton } from "@/components/DelegatedButton";
import { safeCopyToClipboard } from "@/lib/clipboard";
import { trackEvent } from "@/lib/analytics";

export function PromptPlaygroundClient() {
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState("");
  const [tips, setTips] = useState<string[]>([]);
  const [betterVersion, setBetterVersion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleAnalyze() {
    const trimmed = input.trim();
    if (!trimmed) return;

    setLoading(true);
    setError("");
    setFeedback("");
    setTips([]);
    setBetterVersion("");

    try {
      const res = await fetch("/api/playground-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to analyze prompt");
        return;
      }

      setFeedback(data.feedback ?? "");
      setTips(data.tips ?? []);
      setBetterVersion(data.betterVersion ?? "");
      trackEvent("prompt_playground_used", { tool_slug: "prompt-playground" });
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!betterVersion) return;
    const ok = await safeCopyToClipboard(betterVersion);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      trackEvent("prompt_copied", { tool_slug: "prompt-playground" });
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <div>
        <label htmlFor="playground-input" className="block text-sm font-medium text-slate-700">
          Your prompt
        </label>
        <textarea
          id="playground-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Write me a blog post about productivity"
          rows={5}
          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/70"
        />
      </div>

      <DelegatedButton
        onClick={handleAnalyze}
        disabled={loading || !input.trim()}
        className="w-full rounded-xl bg-sky-600 px-5 py-3.5 text-base font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
      >
        {loading ? (
          <>
            <span className="inline-block h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
            Analyzing...
          </>
        ) : (
          "Get feedback & better version"
        )}
      </DelegatedButton>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {(feedback || tips.length > 0 || betterVersion) && (
        <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
          {feedback && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">AI Feedback</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{feedback}</p>
            </div>
          )}

          {tips.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Optimization tips</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                {tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {betterVersion && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-900">Better version</h3>
                <DelegatedButton
                  onClick={handleCopy}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  {copied ? "Copied!" : "Copy"}
                </DelegatedButton>
              </div>
              <pre className="text-sm text-slate-800 whitespace-pre-wrap font-sans bg-white rounded-lg p-3 border border-slate-200">
                {betterVersion}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
