"use client";

/**
 * V81: "Submit your result" - lightweight UGC entry
 */

import { useState } from "react";

type Props = {
  toolSlug: string;
  toolName: string;
  /** Pre-filled content (e.g. generated result) */
  defaultContent?: string;
};

export function UgcSubmitBlock({ toolSlug, toolName, defaultContent = "" }: Props) {
  const [content, setContent] = useState(defaultContent);
  const [exampleResult, setExampleResult] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/ugc-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          toolSlug,
          toolName,
          content: content.trim(),
          exampleResult: exampleResult.trim() || undefined
        })
      });

      if (res.ok) {
        setStatus("done");
        setContent("");
        setExampleResult("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        Thanks! Your submission was received via ToolEagle. We may feature it on future SEO pages.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-900">Submit your result</h3>
      <p className="mt-1 text-xs text-slate-600">
        Share your generated content or example. May be featured on ToolEagle.
      </p>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Paste your caption, hook, or title..."
        className="mt-3 w-full min-h-[80px] rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none resize-none"
        required
      />
      <input
        type="text"
        value={exampleResult}
        onChange={(e) => setExampleResult(e.target.value)}
        placeholder="Example result (optional)"
        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
      />
      <button
        type="submit"
        disabled={status === "sending" || !content.trim()}
        className="mt-3 inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
      >
        {status === "sending" ? "Submitting..." : "Submit"}
      </button>
      {status === "error" && (
        <p className="mt-2 text-xs text-red-600">Something went wrong. Try again.</p>
      )}
    </form>
  );
}
