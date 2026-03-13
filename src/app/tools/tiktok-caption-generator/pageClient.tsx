"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { tools } from "@/config/tools";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { ToolInputCard } from "@/components/tools/ToolInputCard";
import { ToolResultCard } from "@/components/tools/ToolResultCard";
import { ToolCopyButton } from "@/components/tools/ToolCopyButton";
import { ToolProTipsCard } from "@/components/tools/ToolProTipsCard";

export function TikTokCaptionGeneratorClient() {
  const [idea, setIdea] = useState("");
  const [caption, setCaption] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const toolMeta = tools.find((t) => t.slug === "tiktok-caption-generator");

  useEffect(() => {
    if (!toolMeta) return;
    trackEvent("tool_page_view", {
      tool_slug: toolMeta.slug,
      tool_category: toolMeta.category
    });
  }, []);

  function generateCaption() {
    const trimmed = idea.trim();
    if (!trimmed) {
      setCaption(
        "Type a short idea for your TikTok above and I’ll suggest a caption you can paste straight into the app."
      );
      return;
    }

    setIsGenerating(true);

    const hooks = [
      "You need to see this 👇",
      "Nobody is talking about this…",
      "POV:",
      "If you’re a creator, save this:",
      "Stop scrolling for a sec 👇",
      "Creators, read this:"
    ];

    const emojis = ["✨", "🔥", "🚀", "🎯", "📲", "🎥", "💡", "📌", "🤯"];
    const tags = [
      "#tiktoktips",
      "#creators",
      "#contentcreator",
      "#learnontiktok",
      "#fyp",
      "#viral",
      "#tooleagle"
    ];

    const hook = hooks[Math.floor(Math.random() * hooks.length)];
    const emojiTrail = emojis.sort(() => 0.5 - Math.random()).slice(0, 3).join(" ");
    const hashtagBlock = tags.sort(() => 0.5 - Math.random()).slice(0, 4).join(" ");

    const generated = `${hook} ${trimmed}\n\n${emojiTrail}\n${hashtagBlock}`;

    setTimeout(() => {
      setCaption(generated);
      setIsGenerating(false);
      if (toolMeta) {
        trackEvent("tool_generate", {
          tool_slug: toolMeta.slug,
          tool_category: toolMeta.category
        });
      }
    }, 200);
  }

  async function handleCopy() {
    if (!caption) return;
    try {
      await navigator.clipboard.writeText(caption);
      if (toolMeta) {
        trackEvent("tool_copy", {
          tool_slug: toolMeta.slug,
          tool_category: toolMeta.category
        });
      }
      alert("Caption copied. Paste it into TikTok, Instagram or Shorts.");
    } catch {
      alert("Could not copy automatically. Please select the text and copy it manually.");
    }
  }

  const shareOnXUrl = caption
    ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}`
    : undefined;

  return (
    <ToolPageShell
      eyebrow="Tool #1"
      title="TikTok Caption Generator"
      description="Turn a quick idea into a ready-to-post TikTok caption with hooks, emojis and hashtags. Built for creators who want to move fast without overthinking the text."
      input={
        <ToolInputCard label="Your video idea or hook">
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            className="w-full min-h-[110px] resize-none rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner shadow-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400/80"
            placeholder="Example: Share a 10-second tip that shows how to make vertical videos look more cinematic using just your phone."
          />
          <button
            type="button"
            onClick={generateCaption}
            disabled={isGenerating}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-75 transition"
          >
            {isGenerating ? "Crafting your caption…" : "Generate TikTok Caption"}
          </button>
        </ToolInputCard>
      }
      result={
        <ToolResultCard
          title="Preview"
          actions={
            <>
              <ToolCopyButton
                label="Copy caption"
                onClick={handleCopy}
                disabled={!caption}
              />
              {shareOnXUrl && (
                <a
                  href={shareOnXUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-medium text-slate-800 hover:border-sky-500/80 hover:text-sky-700 transition"
                >
                  Share on X
                </a>
              )}
            </>
          }
        >
          {caption ??
            "Your caption will appear here. Once you’re happy, copy it and paste into TikTok, Instagram Reels or YouTube Shorts."}
        </ToolResultCard>
      }
      proTips={
        <ToolProTipsCard
          tips={[
            "Make the first line feel like you; that’s what stops the scroll.",
            "Keep it under 2–3 short lines so it doesn’t get cut off.",
            "Swap in 1–2 of your own branded hashtags to build your niche."
          ]}
        />
      }
    />
  );
}

