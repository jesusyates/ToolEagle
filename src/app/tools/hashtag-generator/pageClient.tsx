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

const TRY_EXAMPLE = "cozy desk setup, aesthetic workspace, productivity tips for students";

const HASHTAG_EXAMPLES = [
  {
    input: "cozy desk setup, aesthetic workspace",
    output: "#cozy #desksetup #aesthetic #workspace #tiktok #contentcreator #fyp #tooleagle"
  },
  {
    input: "morning routine, productivity",
    output: "#morningroutine #productivity #reels #creators #viral #fyp #shorts #tooleagle"
  }
];

type Props = { relatedAside?: ReactNode };

export function HashtagGeneratorClient({ relatedAside }: Props) {
  const [topic, setTopic] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const toolMeta = tools.find((t) => t.slug === "hashtag-generator");

  useEffect(() => {
    if (!toolMeta) return;
    trackEvent("tool_page_view", {
      tool_slug: toolMeta.slug,
      tool_category: toolMeta.category
    });
  }, []);

  function templateGenerate(trimmed: string): string[] {
    const baseTags = ["tiktok", "reels", "shorts", "contentcreator", "creator", "viral", "fyp", "tooleagle"];
    const keywords = trimmed.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 4).map((k) => k.replace(/[^a-z0-9]/g, ""));
    const all = [...keywords, ...baseTags];
    const unique = Array.from(new Set(all.filter(Boolean)));
    const variants: string[] = [];
    for (let i = 0; i < 4; i++) {
      const shuffled = [...unique].sort(() => 0.5 - Math.random());
      variants.push(shuffled.map((t) => `#${t}`).slice(0, 14).join(" "));
    }
    return variants;
  }

  async function generateHashtags() {
    const trimmed = topic.trim();
    if (!trimmed) {
      setResults(["Describe your niche or video topic above to get tailored hashtags."]);
      return;
    }
    if (trimmed.length > MAX_INPUT_LENGTH) {
      setResults([`Please keep your input under ${MAX_INPUT_LENGTH} characters.`]);
      return;
    }

    setIsGenerating(true);

    const aiPrompt = aiPrompts["hashtag-generator"];
    if (aiPrompt) {
      try {
        const prompt = aiPrompt.replace(/\{input\}/g, trimmed);
        const results = await generateAIText(prompt);
        setResults(results);
        if (toolMeta) {
          trackEvent("tool_generate_ai", { tool_slug: toolMeta.slug, tool_category: toolMeta.category, input_length: trimmed.length });
        }
      } catch {
        setResults(templateGenerate(trimmed));
        if (toolMeta) trackEvent("tool_generate", { tool_slug: toolMeta.slug, tool_category: toolMeta.category });
      }
    } else {
      setResults(templateGenerate(trimmed));
      if (toolMeta) trackEvent("tool_generate", { tool_slug: toolMeta.slug, tool_category: toolMeta.category });
    }

    setIsGenerating(false);
  }

  async function handleCopyItem(index: number) {
    const text = results[index];
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
    if (results.length === 0) return;
    const text = results.join("\n\n");
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
      title="Hashtag Generator"
      description="Generate hashtags for TikTok, Reels and Shorts based on your niche or video topic. Keep them relevant, not spammy."
      input={
        <ToolInputCard label="Your niche or video topic">
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
            placeholder="Example: cozy desk setup, aesthetic workspace, productivity tips for students"
          />
          {topic.length > MAX_INPUT_LENGTH && (
            <p className="text-xs text-amber-600 mt-1">Please keep under {MAX_INPUT_LENGTH} characters.</p>
          )}
          <button
            type="button"
            onClick={generateHashtags}
            disabled={isGenerating}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-75 transition duration-150"
          >
            {isGenerating ? "Generating..." : "Generate Hashtags"}
          </button>
        </ToolInputCard>
      }
      result={
        <ToolResultListCard
          title="Result"
          items={results}
          isLoading={isGenerating}
          onCopyItem={handleCopyItem}
          onCopyAll={handleCopyAll}
          emptyMessage="Your hashtags will appear here. Mix 1–2 broad tags with a few niche‑specific ones for best results."
          toolSlug="hashtag-generator"
        />
      }
      howItWorks={
        <HowItWorksCard
          steps={[
            { step: 1, text: "Enter your niche or video topic above." },
            { step: 2, text: "Generate hashtag sets tailored to your content." },
            { step: 3, text: "Copy and post—paste under your TikTok, Reels or Shorts." }
          ]}
        />
      }
      aside={
        <>
          <ExamplesCard
            examples={HASHTAG_EXAMPLES}
            onUseExample={(input) => setTopic(input)}
          />
          <ToolProTipsCard
            tips={[
              "Avoid using the full 30 hashtags—10–18 is usually enough.",
              "Always keep 1–2 branded hashtags unique to your account.",
              "Rotate hashtags across posts so you don't look spammy."
            ]}
          />
          {relatedAside}
        </>
      }
    />
  );
}
