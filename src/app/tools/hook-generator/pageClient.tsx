"use client";

import { ReactNode, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics";
import { safeCopyToClipboard } from "@/lib/clipboard";
import { addToHistory, incrementToolUsage } from "@/lib/storage";
import { tools } from "@/config/tools";
import { aiPrompts, MAX_INPUT_LENGTH } from "@/config/prompts";
import { generateAIText } from "@/lib/ai/generateText";
import { DelegatedButton } from "@/components/DelegatedButton";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { ToolInputCard } from "@/components/tools/ToolInputCard";
import { ToolResultListCard } from "@/components/tools/ToolResultListCard";
import { HistoryPanel } from "@/components/tools/HistoryPanel";
import { HowItWorksCard } from "@/components/tools/HowItWorksCard";
import { ExamplesCard } from "@/components/tools/ExamplesCard";
import { ToolProTipsCard } from "@/components/tools/ToolProTipsCard";

const TRY_EXAMPLE = "Instagram Reels for small business owners, showing how to turn one video into 5 posts.";

const patterns = [
  "POV: {outcome} without {pain}",
  "You're doing {topic} wrong, here's why:",
  "Stop scrolling if you {identity}",
  "No one is talking about {secret}",
  "If you {identity}, watch this before {action}",
  "I tried {experiment} so you don't have to"
];

const HOOK_EXAMPLES = [
  {
    input: "Instagram Reels for small business owners",
    output: "Stop scrolling if you post Instagram Reels for small business owners\n\nPOV: your content is good, but your hook is invisible."
  },
  {
    input: "morning routine productivity tips",
    output: "You're doing morning routine productivity tips wrong, here's why:\n\nI tried morning routine productivity tips hacks so you don't have to"
  }
];

type Props = { relatedAside?: ReactNode };

export function HookGeneratorClient({ relatedAside }: Props) {
  const t = useTranslations("common");
  const [topic, setTopic] = useState("");
  const [hooks, setHooks] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [historyTrigger, setHistoryTrigger] = useState(0);

  const toolMeta = tools.find((t) => t.slug === "hook-generator");

  useEffect(() => {
    if (!toolMeta) return;
    trackEvent("tool_page_view", {
      tool_slug: toolMeta.slug,
      tool_category: toolMeta.category
    });
  }, []);

  function templateGenerate(trimmed: string): string[] {
    const replacements: Record<string, string> = {
      "{outcome}": "getting " + trimmed,
      "{pain}": "burning out on content",
      "{topic}": trimmed,
      "{identity}": "post " + trimmed,
      "{secret}": trimmed + " growth",
      "{action}": "you post your next " + trimmed + " video",
      "{experiment}": trimmed + " hacks"
    };
    return patterns.map((pattern) =>
      pattern.replace(/\{[^}]+\}/g, (match) => replacements[match] ?? trimmed)
    ).slice(0, 5);
  }

  async function generateHooks() {
    const trimmed = topic.trim();
    if (!trimmed) {
      setHooks([
        "Stop scrolling if you want your next video to do better than the last one.",
        "POV: your content is good, but your hook is invisible."
      ]);
      return;
    }
    if (trimmed.length > MAX_INPUT_LENGTH) {
      setHooks([`Please keep your input under ${MAX_INPUT_LENGTH} characters.`]);
      return;
    }

    setIsGenerating(true);

    const aiPrompt = aiPrompts["hook-generator"];
    let results: string[];
    if (aiPrompt) {
      try {
        const prompt = aiPrompt.replace(/\{input\}/g, trimmed);
        results = await generateAIText(prompt);
        if (toolMeta) {
          trackEvent("tool_generate_ai", { tool_slug: toolMeta.slug, tool_category: toolMeta.category, input_length: trimmed.length });
        }
      } catch {
        results = templateGenerate(trimmed);
        if (toolMeta) trackEvent("tool_generate", { tool_slug: toolMeta.slug, tool_category: toolMeta.category });
      }
    } else {
      results = templateGenerate(trimmed);
      if (toolMeta) trackEvent("tool_generate", { tool_slug: toolMeta.slug, tool_category: toolMeta.category });
    }

    setHooks(results);
    setIsGenerating(false);

    if (toolMeta && results.length > 0) {
      incrementToolUsage(toolMeta.slug);
      addToHistory({
        toolSlug: toolMeta.slug,
        toolName: toolMeta.name,
        input: trimmed,
        items: results
      });
      setHistoryTrigger((t) => t + 1);
    }
  }

  async function handleCopyItem(index: number) {
    const text = hooks[index];
    if (!text) return;
    await safeCopyToClipboard(text);
    if (toolMeta) {
      trackEvent("tool_copy", {
        tool_slug: toolMeta.slug,
        tool_category: toolMeta.category
      });
    }
  }

  async function handleCopyAll() {
    if (hooks.length === 0) return;
    const text = hooks.join("\n\n");
    await safeCopyToClipboard(text);
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
      title="Hook Generator"
      description="Generate punchy first lines for TikToks, Reels, Shorts and carousels so people stop and actually listen."
      input={
        <ToolInputCard label="Video topic">
          <DelegatedButton
            onClick={() => setTopic(TRY_EXAMPLE)}
            className="text-xs font-medium text-sky-700 hover:underline mb-2 block"
          >
            {t("tryExample")}
          </DelegatedButton>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            maxLength={MAX_INPUT_LENGTH + 50}
            className="w-full min-h-[100px] resize-none rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner shadow-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400/80"
            placeholder="Example: Instagram Reels for small business owners, showing how to turn one video into 5 posts."
          />
          {topic.length > MAX_INPUT_LENGTH && (
            <p className="text-xs text-amber-600 mt-1">Please keep under {MAX_INPUT_LENGTH} characters.</p>
          )}
          <DelegatedButton
            onClick={generateHooks}
            disabled={isGenerating}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-75 transition duration-150"
          >
            {isGenerating ? (
              <>
                <span className="inline-block h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Generating...
              </>
            ) : (
              <>
                Generate Hooks
                <span className="text-slate-400">→</span>
              </>
            )}
          </DelegatedButton>
        </ToolInputCard>
      }
      result={
        <ToolResultListCard
          title="Hook ideas"
          items={hooks}
          isLoading={isGenerating}
          onCopyItem={handleCopyItem}
          onCopyAll={handleCopyAll}
          onRegenerate={generateHooks}
          emptyMessage="Your hook ideas will appear here. Keep them short enough to say in 2–3 seconds."
          toolSlug="hook-generator"
          toolName="Hook Generator"
        />
      }
      howItWorks={
        <HowItWorksCard
          steps={[
            { step: 1, text: "Enter your video or post topic above." },
            { step: 2, text: "Generate hooks that stop the scroll." },
            { step: 3, text: "Copy and post—use in your script or caption." }
          ]}
        />
      }
      aside={
        <>
          <HistoryPanel toolSlug="hook-generator" refreshTrigger={historyTrigger} />
          <ExamplesCard
            examples={HOOK_EXAMPLES}
            onUseExample={(input) => setTopic(input)}
          />
          <ToolProTipsCard
            tips={[
              "Say your hook out loud; if it's hard to say, it's hard to listen to.",
              "Record the hook twice: one calm, one high‑energy—test which performs better.",
              "Match the hook to the first frame visually so they feel like one idea."
            ]}
          />
          {relatedAside}
        </>
      }
    />
  );
}
