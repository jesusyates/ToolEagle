"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";

const patterns = [
  "POV: {outcome} without {pain}",
  "You’re doing {topic} wrong, here’s why:",
  "Stop scrolling if you {identity}",
  "No one is talking about {secret}",
  "If you {identity}, watch this before {action}",
  "I tried {experiment} so you don’t have to"
];

export function HookGeneratorClient() {
  const [topic, setTopic] = useState("");
  const [hooks, setHooks] = useState<string[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    trackEvent("tool_page_view", { tool: "hook-generator" });
  }, []);

  function generateHooks() {
    const trimmed = topic.trim();
    if (!trimmed) {
      setHooks([
        "Stop scrolling if you want your next video to do better than the last one.",
        "POV: your content is good, but your hook is invisible."
      ]);
      return;
    }

    setIsGenerating(true);

    const replacements = {
      "{outcome}": "getting " + trimmed,
      "{pain}": "burning out on content",
      "{topic}": trimmed,
      "{identity}": "post " + trimmed,
      "{secret}": trimmed + " growth",
      "{action}": "you post your next " + trimmed + " video",
      "{experiment}": trimmed + " hacks"
    };

    const generated = patterns.map((pattern) =>
      pattern.replace(/\{[^}]+\}/g, (match) => (replacements as any)[match] || trimmed)
    );

    setTimeout(() => {
      setHooks(generated.slice(0, 5));
      setIsGenerating(false);
      trackEvent("caption_generate_click", { tool: "hook-generator" });
    }, 200);
  }

  function handleCopyAll() {
    if (!hooks || hooks.length === 0) return;
    const text = hooks.map((h, i) => `${i + 1}. ${h}`).join("\n");
    navigator.clipboard
      .writeText(text)
      .then(() => {
        trackEvent("copy_caption", { tool: "hook-generator" });
        alert("Hooks copied. Paste them into your notes or script doc.");
      })
      .catch(() => {
        alert("Could not copy automatically. Please select and copy manually.");
      });
  }

  return (
    <section className="max-w-5xl mx-auto px-4 pt-10 pb-16">
      <div className="space-y-2 max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">
          Tool
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          Hook Generator
        </h1>
        <p className="text-sm sm:text-base text-slate-300">
          Generate punchy first lines for TikToks, Reels, Shorts and carousels so people stop and
          actually listen.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start">
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5 sm:p-6 shadow-[0_18px_60px_rgba(15,23,42,0.9)]">
          <div className="space-y-3">
            <label className="block text-xs font-medium text-slate-200">
              What is this video/post about?
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full min-h-[100px] resize-none rounded-2xl border border-slate-800 bg-slate-950/70 px-3.5 py-3 text-sm text-slate-50 placeholder:text-slate-500 shadow-inner shadow-black/40 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400/80"
              placeholder="Example: Instagram Reels for small business owners, showing how to turn one video into 5 posts."
            />

            <button
              type="button"
              onClick={generateHooks}
              disabled={isGenerating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-400 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-75"
            >
              {isGenerating ? "Generating hooks…" : "Generate Hooks"}
            </button>
          </div>

          <div className="mt-5 border-t border-slate-800/80 pt-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-xs font-medium text-slate-300">Hook ideas</p>
              <button
                type="button"
                onClick={handleCopyAll}
                disabled={!hooks || hooks.length === 0}
                className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 px-3 py-1 text-[11px] font-medium text-slate-200 hover:border-sky-500/80 hover:text-sky-200 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                Copy all hooks
              </button>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-3.5 py-3 text-sm text-slate-100 min-h-[80px] space-y-1">
              {hooks && hooks.length > 0 ? (
                hooks.map((hook, index) => (
                  <p key={index}>
                    {index + 1}. {hook}
                  </p>
                ))
              ) : (
                <p className="text-slate-400 text-sm">
                  Your hook ideas will appear here. Keep them short enough to say in 2–3 seconds.
                </p>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
              Pro tips
            </p>
            <ul className="mt-2 space-y-1.5 text-[11px] text-slate-400">
              <li>Say your hook out loud; if it&apos;s hard to say, it&apos;s hard to listen to.</li>
              <li>Record the hook twice: one calm, one high‑energy—test which performs better.</li>
              <li>Match the hook to the first frame visually so they feel like one idea.</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}

