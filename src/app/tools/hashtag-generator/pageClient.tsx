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
import { LimitReachedModal } from "@/components/LimitReachedModal";
import { LoginPromptModal } from "@/components/LoginPromptModal";
import { useAuth } from "@/hooks/useAuth";
import { useCountry } from "@/hooks/useCountry";
import { resolveToolPageCopy } from "@/config/tool-page-copy-resolve";
import { generateHashtagTemplate } from "@/lib/generators/fallback/hashtagTemplate";
import { applyContentSafetyToStringArray } from "@/lib/content-safety/filter";
import { normalizeHashtagSets } from "@/lib/tool-output/postprocess";
import { logOutputCopy, mapListCopyToResultType, recordGenerationComplete } from "@/lib/tool-output-quality";

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
  const locale = useLocale();
  const country = useCountry();
  const [topic, setTopic] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [historyTrigger, setHistoryTrigger] = useState(0);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const { isLoggedIn } = useAuth();

  const toolMeta = tools.find((t) => t.slug === "hashtag-generator");
  const pageCopy = resolveToolPageCopy("hashtag-generator", locale);
  const descriptionHero =
    pageCopy?.hero ??
    (locale.startsWith("zh") && toolMeta?.descriptionZh ? toolMeta.descriptionZh : toolMeta?.description ?? "");
  const useSteps = Boolean(pageCopy?.steps);
  const shellIntroProblem = useSteps ? pageCopy!.steps : undefined;
  const shellIntroAudience = useSteps ? "" : undefined;
  const zhUi = locale.startsWith("zh");
  const market = zhUi ? "cn" : "global";

  useEffect(() => {
    if (!toolMeta) return;
    trackEvent("tool_page_view", { tool_slug: toolMeta.slug, tool_category: toolMeta.category, country });
  }, [toolMeta, country]);

  async function generateHashtags() {
    const hadPrior = results.length > 0;
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
        genResults = await generateAIText(prompt, { locale });
        if (toolMeta) {
          trackEvent("tool_generate_ai", { tool_slug: toolMeta.slug, tool_category: toolMeta.category, input_length: trimmed.length, country });
        }
      } catch (err) {
        if (err instanceof LimitReachedError) {
          setLimitModalOpen(true);
          setIsGenerating(false);
          return;
        }
        genResults = generateHashtagTemplate(trimmed);
        if (toolMeta) {
          trackEvent("tool_generate_ai_fallback", {
            tool_slug: toolMeta.slug,
            tool_category: toolMeta.category,
            country
          });
        }
      }
    } else {
      genResults = generateHashtagTemplate(trimmed);
      if (toolMeta) trackEvent("tool_generate", { tool_slug: toolMeta.slug, tool_category: toolMeta.category });
    }

    // V96: output usability — normalize to 2–3 ready-to-paste hashtag sets when possible.
    genResults = normalizeHashtagSets(genResults);

    // Keep Content Safety Engine behavior consistent for user-visible output.
    const cse = applyContentSafetyToStringArray(genResults, market);
    genResults = cse.parts;

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
      recordGenerationComplete(toolMeta.slug, { wasRegenerate: hadPrior });
    }
  }

  async function handleCopyItem(index: number) {
    const text = results[index];
    if (!text) return;
    await navigator.clipboard.writeText(text);
    if (toolMeta) {
      trackEvent("tool_copy", { tool_slug: toolMeta.slug, tool_category: toolMeta.category, country });
    }
  }

  async function handleCopyAll() {
    if (results.length === 0) return;
    const text = results.join("\n\n");
    await safeCopyToClipboard(text);
    if (toolMeta) {
      trackEvent("tool_copy", { tool_slug: toolMeta.slug, tool_category: toolMeta.category, country });
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
      description={descriptionHero}
      introProblem={shellIntroProblem}
      introAudience={shellIntroAudience}
      locale={locale}
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
            placeholder="Example: beginner workout plan + fat-loss moves"
          />
          {topic.length > MAX_INPUT_LENGTH && (
            <p className="text-xs text-amber-600 mt-1">Please keep under {MAX_INPUT_LENGTH} characters.</p>
          )}

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-900">Preview (hashtag sets)</p>
            <div className="mt-2 space-y-2 text-xs text-slate-800">
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                #cozydesk #aestheticworkspace #creatorlife #reels #fyp
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                #productivitytips #shorts #contentcreator #viral #tooleagle
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-600">
              Copy 1 set → paste into TikTok/Reels/Shorts caption (or first comment).
            </p>
          </div>

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
                Start generating
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
          onCopyTrack={(index) => {
            if (!toolMeta) return;
            trackEvent("tool_copy", { tool_slug: toolMeta.slug, tool_category: toolMeta.category, country });
            logOutputCopy(toolMeta.slug, mapListCopyToResultType(toolMeta.slug, index));
          }}
          onRegenerate={generateHashtags}
          onSaveEditedItem={handleSaveEditedItem}
          onItemsChange={handleItemsChange}
          emptyMessage="Copy 1–2 sets and paste into your caption (or first comment). Aim for 10–18 tags."
          toolSlug="hashtag-generator"
          toolName="Hashtag Generator"
          isLoggedIn={isLoggedIn}
          onRequireLogin={() => setLoginModalOpen(true)}
        />
      }
      howItWorks={
        <HowItWorksCard
          title={zhUi ? "怎么用" : "How it works"}
          steps={[
            { step: 1, text: "Enter your niche or video topic above." },
            { step: 2, text: "Generate hashtag sets tailored to your content." },
            { step: 3, text: "Copy 1 set and paste before you hit publish on TikTok/Reels/Shorts." }
          ]}
        />
      }
      proTips={
        <ToolProTipsCard
          title={zhUi ? "进阶技巧" : "Pro tips"}
          tips={[
            "Avoid using the full 30 hashtags—10–18 is usually enough.",
            "Always keep 1–2 branded hashtags unique to your account.",
            "Rotate hashtags across posts so you don't look spammy."
          ]}
        />
      }
      extraSections={[
        {
          title: zhUi ? "历史生成记录" : "Generation history",
          content: <HistoryPanel toolSlug="hashtag-generator" refreshTrigger={historyTrigger} />
        },
        {
          title: zhUi ? "输入示例" : "Input examples",
          content: (
            <ExamplesCard examples={HASHTAG_EXAMPLES} onUseExample={(input) => setTopic(input)} />
          )
        },
        ...(relatedAside
          ? [
              {
                title: zhUi ? "相关工具与资源" : "Related tools and resources",
                content: relatedAside
              }
            ]
          : [])
      ]}
    />
    </>
  );
}
