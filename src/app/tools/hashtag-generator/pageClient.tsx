"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { tools } from "@/config/tools";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { ToolInputCard } from "@/components/tools/ToolInputCard";
import { ToolResultCard } from "@/components/tools/ToolResultCard";
import { ToolCopyButton } from "@/components/tools/ToolCopyButton";
import { ToolProTipsCard } from "@/components/tools/ToolProTipsCard";

export function HashtagGeneratorClient() {
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const toolMeta = tools.find((t) => t.slug === "hashtag-generator");

  useEffect(() => {
    if (!toolMeta) return;
    trackEvent("tool_page_view", {
      tool_slug: toolMeta.slug,
      tool_category: toolMeta.category
    });
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
      if (toolMeta) {
        trackEvent("tool_generate", {
          tool_slug: toolMeta.slug,
          tool_category: toolMeta.category
        });
      }
    }, 200);
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard
      .writeText(result)
      .then(() => {
        if (toolMeta) {
          trackEvent("tool_copy", {
            tool_slug: toolMeta.slug,
            tool_category: toolMeta.category
          });
        }
        alert("Hashtags copied. Paste them under your post.");
      })
      .catch(() => {
        alert("Could not copy automatically. Please select and copy manually.");
      });
  }

  return (
    <ToolPageShell
      eyebrow="Tool"
      title="Hashtag Generator"
      description="Generate hashtags for TikTok, Reels and Shorts based on your niche or video topic. Keep them relevant, not spammy."
      input={
        <ToolInputCard label="Your niche or video topic">
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full min-h-[100px] resize-none rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner shadow-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400/80"
            placeholder="Example: cozy desk setup, aesthetic workspace, productivity tips for students"
          />
          <button
            type="button"
            onClick={generateHashtags}
            disabled={isGenerating}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-75 transition"
          >
            {isGenerating ? "Generating hashtags…" : "Generate Hashtags"}
          </button>
        </ToolInputCard>
      }
      result={
        <ToolResultCard
          title="Result"
          actions={
            <ToolCopyButton
              label="Copy hashtags"
              onClick={handleCopy}
              disabled={!result}
            />
          }
        >
          {result ??
            "Your hashtags will appear here. Mix 1–2 broad tags with a few niche‑specific ones for best results."}
        </ToolResultCard>
      }
      proTips={
        <ToolProTipsCard
          tips={[
            "Avoid using the full 30 hashtags—10–18 is usually enough.",
            "Always keep 1–2 branded hashtags unique to your account.",
            "Rotate hashtags across posts so you don’t look spammy."
          ]}
        />
      }
    />
  );
}

