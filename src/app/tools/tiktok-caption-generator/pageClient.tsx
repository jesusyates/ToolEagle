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
  const t = useTranslations("common");
  const [idea, setIdea] = useState("");
  const [captions, setCaptions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [historyTrigger, setHistoryTrigger] = useState(0);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const { isLoggedIn } = useAuth();

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
    let results: string[];
    if (aiPrompt) {
      try {
        const prompt = aiPrompt.replace(/\{input\}/g, trimmed);
        results = await generateAIText(prompt);
        if (toolMeta) {
          trackEvent("tool_generate_ai", {
            tool_slug: toolMeta.slug,
            tool_category: toolMeta.category,
            input_length: trimmed.length
          });
        }
      } catch (err) {
        if (err instanceof LimitReachedError) {
          setLimitModalOpen(true);
          setIsGenerating(false);
          return;
        }
        results = templateGenerate(trimmed);
        if (toolMeta) {
          trackEvent("tool_generate", {
            tool_slug: toolMeta.slug,
            tool_category: toolMeta.category
          });
        }
      }
    } else {
      results = templateGenerate(trimmed);
      if (toolMeta) {
        trackEvent("tool_generate", {
          tool_slug: toolMeta.slug,
          tool_category: toolMeta.category
        });
      }
    }

    setCaptions(results);
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
    const text = captions[index];
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
    if (captions.length === 0) return;
    const text = captions.join("\n\n---\n\n");
    await safeCopyToClipboard(text);
    if (toolMeta) {
      trackEvent("tool_copy", {
        tool_slug: toolMeta.slug,
        tool_category: toolMeta.category
      });
    }
  }

  async function handleSaveEditedItem(index: number, newText: string) {
    const updated = [...captions];
    updated[index] = newText;
    setCaptions(updated);
    if (!isLoggedIn) {
      setLoginModalOpen(true);
      return;
    }
    addToHistory({
      toolSlug: "tiktok-caption-generator",
      toolName: "TikTok Caption Generator",
      input: idea,
      items: updated
    });
    setHistoryTrigger((prev) => prev + 1);
    await fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        toolSlug: "tiktok-caption-generator",
        toolName: "TikTok Caption Generator",
        input: idea,
        items: updated
      })
    });
  }

  function handleItemsChange(index: number, newText: string) {
    const updated = [...captions];
    updated[index] = newText;
    setCaptions(updated);
  }

  return (
    <>
      <LimitReachedModal open={limitModalOpen} onClose={() => setLimitModalOpen(false)} />
      <LoginPromptModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
      <ToolPageShell
      eyebrow="Tool #1"
      title="TikTok Caption Generator"
      description="Turn a quick idea into a ready-to-post TikTok caption with hooks, emojis and hashtags. Built for creators who want to move fast without overthinking the text."
      input={
        <ToolInputCard label="Video idea">
          <div className="flex items-center justify-between gap-2 mb-2">
            <DelegatedButton
              onClick={() => setIdea(TRY_EXAMPLE)}
              className="text-xs font-medium text-sky-700 hover:underline"
            >
              {t("tryExample")}
            </DelegatedButton>
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
          <DelegatedButton
            onClick={generateCaption}
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
                Generate TikTok Captions
                <span className="text-slate-400">→</span>
              </>
            )}
          </DelegatedButton>
        </ToolInputCard>
      }
      result={
        <ToolResultListCard
          title="Preview"
          items={captions}
          isLoading={isGenerating}
          input={idea}
          onCopyItem={handleCopyItem}
          onCopyAll={handleCopyAll}
          onRegenerate={generateCaption}
          onSaveEditedItem={handleSaveEditedItem}
          onItemsChange={handleItemsChange}
          emptyMessage="Your captions will appear here. Once you're happy, copy one and paste into TikTok, Instagram Reels or YouTube Shorts."
          toolSlug="tiktok-caption-generator"
          toolName="TikTok Caption Generator"
          isLoggedIn={isLoggedIn}
          onRequireLogin={() => setLoginModalOpen(true)}
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
          <HistoryPanel toolSlug="tiktok-caption-generator" refreshTrigger={historyTrigger} />
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
    </>
  );
}
