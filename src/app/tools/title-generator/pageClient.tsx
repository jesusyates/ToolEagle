"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { tools } from "@/config/tools";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { ToolInputCard } from "@/components/tools/ToolInputCard";
import { ToolResultCard } from "@/components/tools/ToolResultCard";
import { ToolCopyButton } from "@/components/tools/ToolCopyButton";
import { ToolProTipsCard } from "@/components/tools/ToolProTipsCard";

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

  const toolMeta = tools.find((t) => t.slug === "title-generator");

  useEffect(() => {
    if (!toolMeta) return;
    trackEvent("tool_page_view", {
      tool_slug: toolMeta.slug,
      tool_category: toolMeta.category
    });
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
      if (toolMeta) {
        trackEvent("tool_generate", {
          tool_slug: toolMeta.slug,
          tool_category: toolMeta.category
        });
      }
    }, 200);
  }

  function handleCopyAll() {
    if (!titles || titles.length === 0) return;
    const text = titles.map((t, i) => `${i + 1}. ${t}`).join("\n");
    navigator.clipboard
      .writeText(text)
      .then(() => {
        if (toolMeta) {
          trackEvent("tool_copy", {
            tool_slug: toolMeta.slug,
            tool_category: toolMeta.category
          });
        }
        alert("Titles copied. Paste them into your planning doc or upload screen.");
      })
      .catch(() => {
        alert("Could not copy automatically. Please select and copy manually.");
      });
  }

  return (
    <ToolPageShell
      eyebrow="Tool"
      title="Title Generator"
      description="Generate click‑worthy titles for YouTube, TikTok, Reels and Shorts based on your topic or niche."
      input={
        <ToolInputCard label="What is this video about?">
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full min-h-[100px] resize-none rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner shadow-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400/80"
            placeholder="Example: how to edit vertical videos faster using CapCut templates"
          />
          <button
            type="button"
            onClick={generateTitles}
            disabled={isGenerating}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-75 transition"
          >
            {isGenerating ? "Generating titles…" : "Generate Titles"}
          </button>
        </ToolInputCard>
      }
      result={
        <ToolResultCard
          title="Title ideas"
          actions={
            <ToolCopyButton
              label="Copy all titles"
              onClick={handleCopyAll}
              disabled={!titles || titles.length === 0}
            />
          }
        >
          {titles && titles.length > 0
            ? titles.map((title, index) => `${index + 1}. ${title}`).join("\n")
            : "Your title ideas will appear here. Use them as a starting point, then tweak for your voice."}
        </ToolResultCard>
      }
      proTips={
        <ToolProTipsCard
          tips={[
            "Write for humans first, algorithm second.",
            "Front‑load the most interesting word in the first 3–4 words.",
            "Pair strong titles with clean thumbnails or first frames."
          ]}
        />
      }
    />
  );
}

