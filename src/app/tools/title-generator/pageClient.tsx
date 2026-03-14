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

const TRY_EXAMPLE = "how to edit vertical videos faster using CapCut templates";

const titlePatterns = [
  "I Tried {topic} So You Don't Have To",
  "{number} {topic} No One Talks About",
  "Stop Doing {wrong} (Do This Instead)",
  "{topic} in {time}: Full Guide",
  "The Truth About {topic}",
  "{number} Mistakes Killing Your {topic}"
];

const TITLE_EXAMPLES = [
  {
    input: "how to edit vertical videos faster",
    output: "I Tried how to edit vertical videos faster So You Don't Have To\n\n7 how to edit vertical videos faster No One Talks About"
  },
  {
    input: "TikTok growth for creators",
    output: "The Truth About TikTok growth for creators\n\n7 Mistakes Killing Your TikTok growth for creators"
  }
];

type Props = { relatedAside?: ReactNode };

export function TitleGeneratorClient({ relatedAside }: Props) {
  const [topic, setTopic] = useState("");
  const [titles, setTitles] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const toolMeta = tools.find((t) => t.slug === "title-generator");

  useEffect(() => {
    if (!toolMeta) return;
    trackEvent("tool_page_view", {
      tool_slug: toolMeta.slug,
      tool_category: toolMeta.category
    });
  }, []);

  function templateGenerate(trimmed: string): string[] {
    const replacements: Record<string, string> = {
      "{topic}": trimmed,
      "{number}": "7",
      "{time}": "10 Minutes",
      "{wrong}": trimmed.toLowerCase()
    };
    return titlePatterns.map((pattern) =>
      pattern.replace(/\{[^}]+\}/g, (match) => replacements[match] ?? trimmed)
    ).slice(0, 6);
  }

  async function generateTitles() {
    const trimmed = topic.trim();
    if (!trimmed) {
      setTitles([
        "10 TikTok Ideas You Can Film in One Afternoon",
        "The Truth About Posting Daily on TikTok",
        "3 Creator Mistakes Killing Your Short‑Form Views"
      ]);
      return;
    }
    if (trimmed.length > MAX_INPUT_LENGTH) {
      setTitles([`Please keep your input under ${MAX_INPUT_LENGTH} characters.`]);
      return;
    }

    setIsGenerating(true);

    const aiPrompt = aiPrompts["title-generator"];
    if (aiPrompt) {
      try {
        const prompt = aiPrompt.replace(/\{input\}/g, trimmed);
        const results = await generateAIText(prompt);
        setTitles(results);
        if (toolMeta) {
          trackEvent("tool_generate_ai", { tool_slug: toolMeta.slug, tool_category: toolMeta.category, input_length: trimmed.length });
        }
      } catch {
        setTitles(templateGenerate(trimmed));
        if (toolMeta) trackEvent("tool_generate", { tool_slug: toolMeta.slug, tool_category: toolMeta.category });
      }
    } else {
      setTitles(templateGenerate(trimmed));
      if (toolMeta) trackEvent("tool_generate", { tool_slug: toolMeta.slug, tool_category: toolMeta.category });
    }

    setIsGenerating(false);
  }

  async function handleCopyItem(index: number) {
    const text = titles[index];
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
    if (titles.length === 0) return;
    const text = titles.join("\n\n");
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
      eyebrow="Tool"
      title="Title Generator"
      description="Generate click‑worthy titles for YouTube, TikTok, Reels and Shorts based on your topic or niche."
      input={
        <ToolInputCard label="What is this video about?">
          <button
            type="button"
            onClick={() => setTopic(TRY_EXAMPLE)}
            className="text-xs font-medium text-sky-700 hover:underline mb-2 block"
          >
            Try example
          </button>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            maxLength={MAX_INPUT_LENGTH + 50}
            className="w-full min-h-[100px] resize-none rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner shadow-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400/80"
            placeholder="Example: how to edit vertical videos faster using CapCut templates"
          />
          {topic.length > MAX_INPUT_LENGTH && (
            <p className="text-xs text-amber-600 mt-1">Please keep under {MAX_INPUT_LENGTH} characters.</p>
          )}
          <button
            type="button"
            onClick={generateTitles}
            disabled={isGenerating}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-75 transition duration-150"
          >
            {isGenerating ? "Generating..." : "Generate Titles"}
          </button>
        </ToolInputCard>
      }
      result={
        <ToolResultListCard
          title="Title ideas"
          items={titles}
          isLoading={isGenerating}
          onCopyItem={handleCopyItem}
          onCopyAll={handleCopyAll}
          emptyMessage="Your title ideas will appear here. Use them as a starting point, then tweak for your voice."
          toolSlug="title-generator"
        />
      }
      howItWorks={
        <HowItWorksCard
          steps={[
            { step: 1, text: "Enter your video topic or niche above." },
            { step: 2, text: "Generate title ideas you can use as-is or tweak." },
            { step: 3, text: "Copy and post—paste into your upload screen or planning doc." }
          ]}
        />
      }
      aside={
        <>
          <ExamplesCard
            examples={TITLE_EXAMPLES}
            onUseExample={(input) => setTopic(input)}
          />
          <ToolProTipsCard
            tips={[
              "Write for humans first, algorithm second.",
              "Front‑load the most interesting word in the first 3–4 words.",
              "Pair strong titles with clean thumbnails or first frames."
            ]}
          />
          {relatedAside}
        </>
      }
    />
  );
}
