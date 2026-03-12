"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";

const titlePatterns = [
  "I Tried {topic} So You Don’t Have To",
  "{number} {topic} No One Talks About",
  "Stop Doing {wrong} (Do This Instead)",
  "{topic} in {time}: Full Guide",
  "The Truth About {topic}",
  "{number} Mistakes Killing Your {topic}"
];

export function TitleGeneratorClient() {
  const [topic, setTopic] = useState("");
  const [titles, setTitles] = useState<string[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    trackEvent("tool_page_view", { tool: "title-generator" });
  }, []);

  function generateTitles() {
    const trimmed = topic.trim();
    if (!trimmed) {
      setTitles([
        "10 TikTok Ideas You Can Film in One Afternoon",
        "The Truth About Posting Daily on TikTok",
        "3 Creator Mistakes Killing Your Short‑Form Views"
      ]);
      return;
    }

    setIsGenerating(true);

    const base = trimmed;
    const replacements = {
      "{topic}": base,
      "{number}": "7",
      "{time}": "10 Minutes",
      "{wrong}": base.toLowerCase()
    };

    const generated = titlePatterns.map((pattern) =>
      pattern.replace(/\{[^}]+\}/g, (match) => (replacements as any)[match] || base)
    );

    setTimeout(() => {
      setTitles(generated.slice(0, 6));
      setIsGenerating(false);
      trackEvent("caption_generate_click", { tool: "title-generator" });
    }, 200);
  }

  function handleCopyAll() {
    if (!titles || titles.length === 0) return;
    const text = titles.map((t, i) => `${i + 1}. ${t}`).join("\n");
    navigator.clipboard
      .writeText(text)
      .then(() => {
        trackEvent("copy_caption", { tool: "title-generator" });
        alert("Titles copied. Paste them into your planning doc or upload screen.");
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
          Title Generator
        </h1>
        <p className="text-sm sm:text-base text-slate-300">
          Generate click‑worthy titles for YouTube, TikTok, Reels and Shorts based on your topic or
          niche.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start">
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5 sm:p-6 shadow-[0_18px_60px_rgba(15,23,42,0.9)]">
          <div className="space-y-3">
            <label className="block text-xs font-medium text-slate-200">
              What is this video about?
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full min-h-[100px] resize-none rounded-2xl border border-slate-800 bg-slate-950/70 px-3.5 py-3 text-sm text-slate-50 placeholder:text-slate-500 shadow-inner shadow-black/40 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400/80"
              placeholder="Example: how to edit vertical videos faster using CapCut templates"
            />

            <button
              type="button"
              onClick={generateTitles}
              disabled={isGenerating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-400 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-75"
            >
              {isGenerating ? "Generating titles…" : "Generate Titles"}
            </button>
          </div>

          <div className="mt-5 border-t border-slate-800/80 pt-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-xs font-medium text-slate-300">Title ideas</p>
              <button
                type="button"
                onClick={handleCopyAll}
                disabled={!titles || titles.length === 0}
                className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 px-3 py-1 text-[11px] font-medium text-slate-200 hover:border-sky-500/80 hover:text-sky-200 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                Copy all titles
              </button>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-3.5 py-3 text-sm text-slate-100 min-h-[80px] space-y-1">
              {titles && titles.length > 0 ? (
                titles.map((title, index) => (
                  <p key={index}>
                    {index + 1}. {title}
                  </p>
                ))
              ) : (
                <p className="text-slate-400 text-sm">
                  Your title ideas will appear here. Use them as a starting point, then tweak for
                  your voice.
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
              <li>Write for humans first, algorithm second.</li>
              <li>Front‑load the most interesting word in the first 3–4 words.</li>
              <li>Pair strong titles with clean thumbnails or first frames.</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}

