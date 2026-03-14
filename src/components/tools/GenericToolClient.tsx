"use client";

import { ReactNode, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics";
import { safeCopyToClipboard } from "@/lib/clipboard";
import { addToHistory, incrementToolUsage } from "@/lib/storage";
import { tools } from "@/config/tools";
import { generators } from "@/config/generators";
import { aiPrompts, MAX_INPUT_LENGTH } from "@/config/prompts";
import { generateAIText } from "@/lib/ai/generateText";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { ToolInputCard } from "@/components/tools/ToolInputCard";
import { ToolResultListCard } from "@/components/tools/ToolResultListCard";
import { HistoryPanel } from "@/components/tools/HistoryPanel";
import { HowItWorksCard } from "@/components/tools/HowItWorksCard";
import { ExamplesCard } from "@/components/tools/ExamplesCard";
import { ToolProTipsCard } from "@/components/tools/ToolProTipsCard";
import { DelegatedButton } from "@/components/DelegatedButton";

type GenericToolClientProps = {
  slug: string;
  relatedAside?: ReactNode;
};

export function GenericToolClient({ slug, relatedAside }: GenericToolClientProps) {
  const [input, setInput] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [historyTrigger, setHistoryTrigger] = useState(0);

  const toolMeta = tools.find((t) => t.slug === slug);
  const config = generators[slug];

  useEffect(() => {
    if (!toolMeta) return;
    trackEvent("tool_page_view", {
      tool_slug: toolMeta.slug,
      tool_category: toolMeta.category
    });
  }, [toolMeta]);

  if (!toolMeta || !config) return null;

  const t = useTranslations("common");

  async function handleGenerate() {
    const trimmed = input.trim();
    if (!trimmed) {
      setItems([`Enter your input above to generate ${config.resultTitle.toLowerCase()}.`]);
      return;
    }

    if (trimmed.length > MAX_INPUT_LENGTH) {
      setItems([`Please keep your input under ${MAX_INPUT_LENGTH} characters.`]);
      return;
    }

    setIsGenerating(true);

    const aiPrompt = aiPrompts[slug];
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
      } catch {
        results = config.generate(trimmed);
        if (toolMeta) {
          trackEvent("tool_generate", {
            tool_slug: toolMeta.slug,
            tool_category: toolMeta.category
          });
        }
      }
    } else {
      results = config.generate(trimmed);
      if (toolMeta) {
        trackEvent("tool_generate", {
          tool_slug: toolMeta.slug,
          tool_category: toolMeta.category
        });
      }
    }

    setItems(results);
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
    const text = items[index];
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
    if (items.length === 0) return;
    const text = items.join("\n\n---\n\n");
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
      title={toolMeta.name}
      description={toolMeta.description}
      input={
        <ToolInputCard label={config.inputLabel}>
          <DelegatedButton
            onClick={() => setInput(config.tryExample)}
            className="text-xs font-medium text-sky-700 hover:underline mb-2 block"
          >
            {t("tryExample")}
          </DelegatedButton>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={MAX_INPUT_LENGTH + 50}
            className="w-full min-h-[100px] resize-none rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner shadow-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400/80"
            placeholder={config.placeholder}
          />
          {input.length > MAX_INPUT_LENGTH && (
            <p className="text-xs text-amber-600 mt-1">
              Please keep under {MAX_INPUT_LENGTH} characters for best results.
            </p>
          )}
          <DelegatedButton
            onClick={handleGenerate}
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
                {config.buttonLabel}
                <span className="text-slate-400">→</span>
              </>
            )}
          </DelegatedButton>
        </ToolInputCard>
      }
      result={
        <ToolResultListCard
          title={config.resultTitle}
          items={items}
          isLoading={isGenerating}
          onCopyItem={handleCopyItem}
          onCopyAll={handleCopyAll}
          onRegenerate={handleGenerate}
          emptyMessage={config.emptyMessage}
          toolSlug={slug}
          toolName={toolMeta.name}
        />
      }
      howItWorks={<HowItWorksCard steps={config.howItWorks} />}
      aside={
        <>
          <HistoryPanel toolSlug={slug} refreshTrigger={historyTrigger} />
          <ExamplesCard examples={config.examples} onUseExample={(i) => setInput(i)} />
          <ToolProTipsCard tips={config.proTips} />
          {relatedAside}
        </>
      }
    />
  );
}
