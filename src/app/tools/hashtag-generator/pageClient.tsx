"use client";

import { ReactNode, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics";
import { safeCopyToClipboard } from "@/lib/clipboard";
import { addToHistory, incrementToolUsage } from "@/lib/storage";
import { tools } from "@/config/tools";
import { aiPrompts, MAX_INPUT_LENGTH } from "@/config/prompts";
import { generateAIText, LimitReachedError } from "@/lib/ai/generateText";
import { DelegatedButton } from "@/components/DelegatedButton";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { ToolInputCard } from "@/components/tools/ToolInputCard";
import { ToolResultListCard } from "@/components/tools/ToolResultListCard";
import { HistoryPanel } from "@/components/tools/HistoryPanel";
import { HowItWorksCard } from "@/components/tools/HowItWorksCard";
import { ExamplesCard } from "@/components/tools/ExamplesCard";
import { ToolProTipsCard } from "@/components/tools/ToolProTipsCard";
import { LimitReachedModal } from "@/components/LimitReachedModal";
import { LoginPromptModal } from "@/components/LoginPromptModal";
import { useAuth } from "@/hooks/useAuth";

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
  const t = useTranslations("common");
  const [topic, setTopic] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [historyTrigger, setHistoryTrigger] = useState(0);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const { isLoggedIn } = useAuth();

  const toolMeta = tools.find((t) => t.slug === "hashtag-generator");

  useEffect(() => {
    if (!toolMeta) return;
    trackEvent("tool_page_view", {
      tool_slug: toolMeta.slug,
      tool_category: toolMeta.category
    });
  }, [toolMeta]);

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
    let genResults: string[];
    if (aiPrompt) {
      try {
        const prompt = aiPrompt.replace(/\{input\}/g, trimmed);
        genResults = await generateAIText(prompt);
        if (toolMeta) {
          trackEvent("tool_generate_ai", { tool_slug: toolMeta.slug, tool_category: toolMeta.category, input_length: trimmed.length });
        }
      } catch (err) {
        if (err instanceof LimitReachedError) {
          setLimitModalOpen(true);
          setIsGenerating(false);
          return;
        }
        genResults = templateGenerate(trimmed);
        if (toolMeta) trackEvent("tool_generate", { tool_slug: toolMeta.slug, tool_category: toolMeta.category });
      }
    } else {
      genResults = templateGenerate(trimmed);
      if (toolMeta) trackEvent("tool_generate", { tool_slug: toolMeta.slug, tool_category: toolMeta.category });
    }

    setResults(genResults);
    setIsGenerating(false);

    if (toolMeta && genResults.length > 0) {
      incrementToolUsage(toolMeta.slug);
      addToHistory({
        toolSlug: toolMeta.slug,
        toolName: toolMeta.name,
        input: trimmed,
        items: genResults
      });
      setHistoryTrigger((t) => t + 1);
    }
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
    await safeCopyToClipboard(text);
    if (toolMeta) {
      trackEvent("tool_copy", {
        tool_slug: toolMeta.slug,
        tool_category: toolMeta.category
      });
    }
  }

  async function handleSaveEditedItem(index: number, newText: string) {
    const updated = [...results];
    updated[index] = newText;
    setResults(updated);
    if (!isLoggedIn) {
      setLoginModalOpen(true);
      return;
    }
    addToHistory({
      toolSlug: "hashtag-generator",
      toolName: "Hashtag Generator",
      input: topic,
      items: updated
    });
    setHistoryTrigger((prev) => prev + 1);
    await fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        toolSlug: "hashtag-generator",
        toolName: "Hashtag Generator",
        input: topic,
        items: updated
      })
    });
  }

  function handleItemsChange(index: number, newText: string) {
    const updated = [...results];
    updated[index] = newText;
    setResults(updated);
  }

  return (
    <>
      <LimitReachedModal open={limitModalOpen} onClose={() => setLimitModalOpen(false)} />
      <LoginPromptModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
      <ToolPageShell
      eyebrow="Tool"
      title="Hashtag Generator"
      description="Generate hashtags for TikTok, Reels and Shorts based on your niche or video topic. Keep them relevant, not spammy."
      input={
        <ToolInputCard label="Niche or topic">
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
            placeholder="Example: cozy desk setup, aesthetic workspace, productivity tips for students"
          />
          {topic.length > MAX_INPUT_LENGTH && (
            <p className="text-xs text-amber-600 mt-1">Please keep under {MAX_INPUT_LENGTH} characters.</p>
          )}
          <DelegatedButton
            onClick={generateHashtags}
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
                Generate Hashtags
                <span className="text-slate-400">→</span>
              </>
            )}
          </DelegatedButton>
        </ToolInputCard>
      }
      result={
        <ToolResultListCard
          title="Result"
          items={results}
          isLoading={isGenerating}
          input={topic}
          onCopyItem={handleCopyItem}
          onCopyAll={handleCopyAll}
          onRegenerate={generateHashtags}
          onSaveEditedItem={handleSaveEditedItem}
          onItemsChange={handleItemsChange}
          emptyMessage="Your hashtags will appear here. Mix 1–2 broad tags with a few niche‑specific ones for best results."
          toolSlug="hashtag-generator"
          toolName="Hashtag Generator"
          isLoggedIn={isLoggedIn}
          onRequireLogin={() => setLoginModalOpen(true)}
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
          <HistoryPanel toolSlug="hashtag-generator" refreshTrigger={historyTrigger} />
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
    </>
  );
}
