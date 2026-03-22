"use client";

import { ReactNode, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
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
import { CtaLinksSection } from "@/components/tools/CtaLinksSection";
import { LimitReachedModal } from "@/components/LimitReachedModal";
import { LoginPromptModal } from "@/components/LoginPromptModal";
import { ExitIntentCta } from "@/components/tools/ExitIntentCta";
import { ZhCtaCaptureBlock } from "@/components/zh/ZhCtaCaptureBlock";
import { useAuth } from "@/hooks/useAuth";
import { useCountry } from "@/hooks/useCountry";

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

type Props = { relatedAside?: ReactNode; ctaLinks?: { href: string; label: string }[]; showZhInlineLead?: boolean };

export function TitleGeneratorClient({ relatedAside, ctaLinks, showZhInlineLead }: Props) {
  const tCommon = useTranslations("common");
  const tTool = useTranslations("toolPages");
  const tTitle = useTranslations("toolPages.titleGenerator");
  const locale = useLocale();
  const country = useCountry();
  const [topic, setTopic] = useState("");
  const [titles, setTitles] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [historyTrigger, setHistoryTrigger] = useState(0);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const { isLoggedIn } = useAuth();

  const toolMeta = tools.find((t) => t.slug === "title-generator");

  useEffect(() => {
    if (!toolMeta) return;
    trackEvent("tool_page_view", { tool_slug: toolMeta.slug, tool_category: toolMeta.category, country });
  }, [toolMeta, country]);

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
      setTitles([tTool("maxLengthError", { max: MAX_INPUT_LENGTH })]);
      return;
    }

    setIsGenerating(true);

    const aiPrompt = aiPrompts["title-generator"];
    let results: string[];
    if (aiPrompt) {
      try {
        const prompt = aiPrompt.replace(/\{input\}/g, trimmed);
        results = await generateAIText(prompt, { locale });
        if (toolMeta) {
          trackEvent("tool_generate_ai", { tool_slug: toolMeta.slug, tool_category: toolMeta.category, input_length: trimmed.length, country });
        }
      } catch (err) {
        if (err instanceof LimitReachedError) {
          setLimitModalOpen(true);
          setIsGenerating(false);
          return;
        }
        results = templateGenerate(trimmed);
        if (toolMeta) trackEvent("tool_generate", { tool_slug: toolMeta.slug, tool_category: toolMeta.category, country });
      }
    } else {
      results = templateGenerate(trimmed);
      if (toolMeta) trackEvent("tool_generate", { tool_slug: toolMeta.slug, tool_category: toolMeta.category });
    }

    setTitles(results);
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
    const text = titles[index];
    if (!text) return;
    await safeCopyToClipboard(text);
    if (toolMeta) {
      trackEvent("tool_copy", { tool_slug: toolMeta.slug, tool_category: toolMeta.category, country });
    }
  }

  async function handleCopyAll() {
    if (titles.length === 0) return;
    const text = titles.join("\n\n");
    await safeCopyToClipboard(text);
    if (toolMeta) {
      trackEvent("tool_copy", { tool_slug: toolMeta.slug, tool_category: toolMeta.category, country });
    }
  }

  async function handleSaveEditedItem(index: number, newText: string) {
    const updated = [...titles];
    updated[index] = newText;
    setTitles(updated);
    if (!isLoggedIn) {
      setLoginModalOpen(true);
      return;
    }
    addToHistory({
      toolSlug: "title-generator",
      toolName: "Title Generator",
      input: topic,
      items: updated
    });
    setHistoryTrigger((prev) => prev + 1);
    await fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        toolSlug: "title-generator",
        toolName: "Title Generator",
        input: topic,
        items: updated
      })
    });
  }

  function handleItemsChange(index: number, newText: string) {
    const updated = [...titles];
    updated[index] = newText;
    setTitles(updated);
  }

  return (
    <>
      <LimitReachedModal open={limitModalOpen} onClose={() => setLimitModalOpen(false)} />
      <LoginPromptModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
      {titles.length > 0 && <ExitIntentCta toolSlug="title-generator" toolName={tTitle("title")} />}
      <ToolPageShell
      eyebrow={tTool("eyebrow")}
      title={tTitle("title")}
      description={tTitle("description")}
      input={
        <ToolInputCard label={tTitle("inputLabel")}>
          <DelegatedButton
            onClick={() => setTopic(TRY_EXAMPLE)}
            className="text-xs font-medium text-sky-700 hover:underline mb-2 block"
          >
            {tCommon("tryExample")}
          </DelegatedButton>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            maxLength={MAX_INPUT_LENGTH + 50}
            className="w-full min-h-[100px] resize-none rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner shadow-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400/80"
            placeholder={tTitle("placeholder")}
          />
          {topic.length > MAX_INPUT_LENGTH && (
            <p className="text-xs text-amber-600 mt-1">{tTool("maxLengthError", { max: MAX_INPUT_LENGTH })}</p>
          )}
          <DelegatedButton
            onClick={generateTitles}
            disabled={isGenerating}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-slate-800 transition duration-150 disabled:cursor-not-allowed disabled:opacity-75"
          >
            {isGenerating ? (
              <>
                <span className="inline-block h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                {tTool("generating")}
              </>
            ) : (
              <>
                {tTitle("generateButton")}
                <span className="text-slate-400">→</span>
              </>
            )}
          </DelegatedButton>
        </ToolInputCard>
      }
      result={
        <ToolResultListCard
          title={tTitle("resultTitle")}
          items={titles}
          isLoading={isGenerating}
          input={topic}
          onCopyItem={handleCopyItem}
          onCopyAll={handleCopyAll}
          onCopyTrack={() => toolMeta && trackEvent("tool_copy", { tool_slug: toolMeta.slug, tool_category: toolMeta.category, country })}
          onRegenerate={generateTitles}
          onSaveEditedItem={handleSaveEditedItem}
          onItemsChange={handleItemsChange}
          emptyMessage={tTitle("emptyMessage")}
          toolSlug="title-generator"
          toolName={tTitle("title")}
          isLoggedIn={isLoggedIn}
          onRequireLogin={() => setLoginModalOpen(true)}
        />
      }
      howItWorks={
        <HowItWorksCard
          steps={[
            { step: 1, text: tTitle("howItWorks1") },
            { step: 2, text: tTitle("howItWorks2") },
            { step: 3, text: tTitle("howItWorks3") }
          ]}
        />
      }
      aside={
        <>
          <HistoryPanel toolSlug="title-generator" refreshTrigger={historyTrigger} />
          <ExamplesCard
            examples={TITLE_EXAMPLES}
            onUseExample={(input) => setTopic(input)}
          />
          <ToolProTipsCard
            tips={[tTitle("proTip1"), tTitle("proTip2"), tTitle("proTip3")]}
          />
          {ctaLinks && ctaLinks.length > 0 && <CtaLinksSection links={ctaLinks} />}
          {showZhInlineLead && <ZhCtaCaptureBlock keyword="爆款标题" inline />}
          {relatedAside}
        </>
      }
    />
    </>
  );
}
