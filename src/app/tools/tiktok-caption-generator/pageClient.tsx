"use client";

import { ReactNode, useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { tools } from "@/config/tools";
import { aiPrompts, MAX_INPUT_LENGTH } from "@/config/prompts";
import { generateAIText } from "@/lib/ai/generateText";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { ToolInputCard } from "@/components/tools/ToolInputCard";
import { ToolResultListCard } from "@/components/tools/ToolResultListCard";
import { HowItWorksCard } from "@/components/tools/HowItWorksCard";
import { ExamplesCard } from "@/components/tools/ExamplesCard";
import { ToolProTipsCard } from "@/components/tools/ToolProTipsCard";

const TRY_EXAMPLE = "A video about a morning productivity routine";

const CAPTION_EXAMPLES = [
  {
    input: "A video about a morning productivity routine",
    output: "You need to see this 👇\n\nA video about a morning productivity routine\n\n✨ 🔥 🎯\n#tiktoktips #creators #contentcreator #learnontiktok"
  },
  {
    input: "Quick tip: how to edit vertical videos faster",
    output: "Stop scrolling for a sec 👇\n\nQuick tip: how to edit vertical videos faster\n\n💡 📲 🎥\n#fyp #viral #creators #tooleagle"
  }
];

type Props = { relatedAside?: ReactNode };

export function TikTokCaptionGeneratorClient({ relatedAside }: Props) {
  const [idea, setIdea] = useState("");
  const [captions, setCaptions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const toolMeta = tools.find((t) => t.slug === "tiktok-caption-generator");

  useEffect(() => {
    if (!toolMeta) return;
    trackEvent("tool_page_view", {
      tool_slug: toolMeta.slug,
      tool_category: toolMeta.category
    });
  }, []);

  function templateGenerate(trimmed: string): string[] {
    const hooks = [
      "You need to see this 👇",
      "Nobody is talking about this…",
      "POV:",
      "If you're a creator, save this:",
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
    const results: string[] = [];
    for (let i = 0; i < 4; i++) {
      const hook = hooks[(i + Math.floor(Math.random() * 2)) % hooks.length];
      const emojiTrail = [...emojis].sort(() => 0.5 - Math.random()).slice(0, 3).join(" ");
      const hashtagBlock = [...tags].sort(() => 0.5 - Math.random()).slice(0, 4).join(" ");
      results.push(`${hook} ${trimmed}\n\n${emojiTrail}\n${hashtagBlock}`);
    }
    return results;
  }

  async function generateCaption() {
    const trimmed = idea.trim();
    if (!trimmed) {
      setCaptions([
        "Type a short idea for your TikTok above and I'll suggest a caption you can paste straight into the app."
      ]);
      return;
    }
    if (trimmed.length > MAX_INPUT_LENGTH) {
      setCaptions([`Please keep your input under ${MAX_INPUT_LENGTH} characters.`]);
      return;
    }

    setIsGenerating(true);

    const aiPrompt = aiPrompts["tiktok-caption-generator"];
    if (aiPrompt) {
      try {
        const prompt = aiPrompt.replace(/\{input\}/g, trimmed);
        const results = await generateAIText(prompt);
        setCaptions(results);
        if (toolMeta) {
          trackEvent("tool_generate_ai", {
            tool_slug: toolMeta.slug,
            tool_category: toolMeta.category,
            input_length: trimmed.length
          });
        }
      } catch {
        setCaptions(templateGenerate(trimmed));
        if (toolMeta) {
          trackEvent("tool_generate", {
            tool_slug: toolMeta.slug,
            tool_category: toolMeta.category
          });
        }
      }
    } else {
      setCaptions(templateGenerate(trimmed));
      if (toolMeta) {
        trackEvent("tool_generate", {
          tool_slug: toolMeta.slug,
          tool_category: toolMeta.category
        });
      }
    }

    setIsGenerating(false);
  }

  async function handleCopyItem(index: number) {
    const text = captions[index];
    if (!text) return;
    await navigator.clipboard.writeText(text);
    if (toolMeta) {
      trackEvent("tool_copy", {
        tool_slug: toolMeta.slug,
        tool_category: toolMeta.category
      });
    }
  }

  async function handleCopyAll() {
    if (captions.length === 0) return;
    const text = captions.join("\n\n---\n\n");
    await navigator.clipboard.writeText(text);
    if (toolMeta) {
      trackEvent("tool_copy", {
        tool_slug: toolMeta.slug,
        tool_category: toolMeta.category
      });
    }
  }

  return (
    <ToolPageShell
      eyebrow="Tool #1"
      title="TikTok Caption Generator"
      description="Turn a quick idea into a ready-to-post TikTok caption with hooks, emojis and hashtags. Built for creators who want to move fast without overthinking the text."
      input={
        <ToolInputCard label="Your video idea or hook">
          <div className="flex items-center justify-between gap-2 mb-2">
            <button
              type="button"
              onClick={() => setIdea(TRY_EXAMPLE)}
              className="text-xs font-medium text-sky-700 hover:underline"
            >
              Try example
            </button>
          </div>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            maxLength={MAX_INPUT_LENGTH + 50}
            className="w-full min-h-[110px] resize-none rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner shadow-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400/80"
            placeholder="Example: Share a 10-second tip that shows how to make vertical videos look more cinematic using just your phone."
          />
          {idea.length > MAX_INPUT_LENGTH && (
            <p className="text-xs text-amber-600 mt-1">
              Please keep under {MAX_INPUT_LENGTH} characters for best results.
            </p>
          )}
          <button
            type="button"
            onClick={generateCaption}
            disabled={isGenerating}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-75 transition duration-150"
          >
            {isGenerating ? "Generating..." : "Generate TikTok Captions"}
          </button>
        </ToolInputCard>
      }
      result={
        <ToolResultListCard
          title="Preview"
          items={captions}
          isLoading={isGenerating}
          onCopyItem={handleCopyItem}
          onCopyAll={handleCopyAll}
          emptyMessage="Your captions will appear here. Once you're happy, copy one and paste into TikTok, Instagram Reels or YouTube Shorts."
          toolSlug="tiktok-caption-generator"
        />
      }
      howItWorks={
        <HowItWorksCard
          steps={[
            { step: 1, text: "Enter your idea or hook in the box above." },
            { step: 2, text: "Generate captions with hooks, emojis and hashtags." },
            { step: 3, text: "Copy and post—paste into TikTok, Reels or Shorts." }
          ]}
        />
      }
      aside={
        <>
          <ExamplesCard
            examples={CAPTION_EXAMPLES}
            onUseExample={(input) => setIdea(input)}
          />
          <ToolProTipsCard
            tips={[
              "Make the first line feel like you; that's what stops the scroll.",
              "Keep it under 2–3 short lines so it doesn't get cut off.",
              "Swap in 1–2 of your own branded hashtags to build your niche."
            ]}
          />
          {relatedAside}
        </>
      }
    />
  );
}
