"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";

export function HashtagGeneratorClient() {
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    trackEvent("tool_page_view", { tool: "hashtag-generator" });
  }, []);

  function generateHashtags() {
    const trimmed = topic.trim();
    if (!trimmed) {
      setResult("Describe your niche or video topic above to get tailored hashtags.");
      return;
    }

    setIsGenerating(true);

    const baseTags = [
      "tiktok",
      "reels",
      "shorts",
      "contentcreator",
      "creator",
      "viral",
      "fyp",
      "tooleagle"
    ];

    const keywords = trimmed
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 4)
      .map((k) => k.replace(/[^a-z0-9]/g, ""));

    const all = [...keywords, ...baseTags];
    const unique = Array.from(new Set(all.filter(Boolean)));
    const hashtags = unique.map((t) => `#${t}`).slice(0, 18);

    setTimeout(() => {
      setResult(hashtags.join(" "));
      setIsGenerating(false);
      trackEvent("caption_generate_click", { tool: "hashtag-generator" });
    }, 200);
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard
      .writeText(result)
      .then(() => {
        trackEvent("copy_caption", { tool: "hashtag-generator" });
        alert("Hashtags copied. Paste them under your post.");
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
          Hashtag Generator
        </h1>
        <p className="text-sm sm:text-base text-slate-300">
          Generate hashtags for TikTok, Reels and Shorts based on your niche or video topic. Keep
          them relevant, not spammy.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start">
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5 sm:p-6 shadow-[0_18px_60px_rgba(15,23,42,0.9)]">
          <div className="space-y-3">
            <label className="block text-xs font-medium text-slate-200">
              Your niche or video topic
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full min-h-[100px] resize-none rounded-2xl border border-slate-800 bg-slate-950/70 px-3.5 py-3 text-sm text-slate-50 placeholder:text-slate-500 shadow-inner shadow-black/40 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400/80"
              placeholder="Example: cozy desk setup, aesthetic workspace, productivity tips for students"
            />

            <button
              type="button"
              onClick={generateHashtags}
              disabled={isGenerating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-400 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-75"
            >
              {isGenerating ? "Generating hashtags…" : "Generate Hashtags"}
            </button>
          </div>

          <div className="mt-5 border-t border-slate-800/80 pt-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-xs font-medium text-slate-300">Result</p>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!result}
                className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 px-3 py-1 text-[11px] font-medium text-slate-200 hover:border-sky-500/80 hover:text-sky-200 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                Copy hashtags
              </button>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-3.5 py-3 text-sm text-slate-100 whitespace-pre-line min-h-[80px]">
              {result ??
                "Your hashtags will appear here. Mix 1–2 broad tags with a few niche‑specific ones for best results."}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
              Pro tips
            </p>
            <ul className="mt-2 space-y-1.5 text-[11px] text-slate-400">
              <li>Avoid using the full 30 hashtags—10–18 is usually enough.</li>
              <li>Always keep 1–2 branded hashtags unique to your account.</li>
              <li>Rotate hashtags across posts so you don&apos;t look spammy.</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}

