"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { ZhCtaCaptureBlock } from "@/components/zh/ZhCtaCaptureBlock";
import { useAuth } from "@/hooks/useAuth";
import { useCountry } from "@/hooks/useCountry";
import { resolveToolPageCopy } from "@/config/tool-page-copy-resolve";
import { generateTitleTemplate } from "@/lib/generators/fallback/titleTemplate";
import { applyContentSafetyToStringArray } from "@/lib/content-safety/filter";
import { normalizeTitleCandidates } from "@/lib/tool-output/postprocess";
import { logOutputCopy, mapListCopyToResultType, recordGenerationComplete } from "@/lib/tool-output-quality";
import { parseUsageStatusForToolUi, type UsageStatusUiSlice } from "@/lib/usage-status-client";
import { ToolUsageStatusHints } from "@/components/tools/ToolUsageStatusHints";
import { CreatorKnowledgeEnginePanel } from "@/components/tools/CreatorKnowledgeEnginePanel";
import { CreatorScoreCard } from "@/components/tools/CreatorScoreCard";
import { CreatorMonetizationCard } from "@/components/tools/CreatorMonetizationCard";
import { CreatorTakeoverGuidance } from "@/components/tools/CreatorTakeoverGuidance";
import { CreatorAnalysisInsightCard } from "@/components/tools/CreatorAnalysisInsightCard";
import { WorkflowNextStepCard } from "@/components/tools/WorkflowNextStepCard";
import { V186ContextStrip } from "@/components/tools/V186ContextStrip";
import { ReadyToPostModal } from "@/components/tools/ReadyToPostModal";
import { TikTokChainBadge } from "@/components/tools/TikTokChainBadge";
import { TikTokChainProgressHint } from "@/components/tools/TikTokChainProgressHint";
import { defaultUploadPlatformForTool } from "@/lib/creator-guidance/workflow-chain";
import { initTikTokChainSessionOnTool, readV195ChainSessionId } from "@/lib/tiktok-chain-tracking";
import { loadCreatorMemory, recordV187V186Context } from "@/lib/creator-guidance/creator-memory-store";
import { inferCreatorProfile } from "@/lib/creator-guidance/infer-creator-profile";
import { getMonetizationModeForKnowledgeEngine } from "@/lib/creator-guidance/infer-monetization-profile";
import {
  buildV186PromptPrefixForPlainGenerateWithMeta,
  inferPlatformFromToolSlug
} from "@/lib/creator-knowledge-engine/resolve-v186";
import { loadCreatorAnalysis } from "@/lib/creator-analysis/storage";
import { buildCreatorAnalysisSummaryForPrompt } from "@/lib/creator-analysis/to-downstream";
import assets from "@/config/creator-knowledge-engine/v186-assets.json";

const TRY_EXAMPLE = "how to edit vertical videos faster using CapCut templates";

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
  const searchParams = useSearchParams();
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [readyPostOpen, setReadyPostOpen] = useState(false);
  const [titles, setTitles] = useState<string[]>([]);
  const [contentId, setContentId] = useState<string | null>(null);
  const [v193ResultHint, setV193ResultHint] = useState<string | null>(null);
  const [v193ChainBadge, setV193ChainBadge] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [historyTrigger, setHistoryTrigger] = useState(0);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [usageUi, setUsageUi] = useState<UsageStatusUiSlice>({
    cnBilling: null,
    cnCreditsRemaining: null,
    cnCreditsDaysLeft: null,
    usageRemaining: null
  });
  const { isLoggedIn } = useAuth();

  const keDefault = useMemo(() => {
    const intents = assets.intent_chips["title-generator"];
    const sc = assets.scenario_chips["title-generator"];
    return {
      intentId: intents?.[0]?.id ?? "intent_views",
      scenarioId: sc?.[0]?.id ?? "sc_tutorial"
    };
  }, []);
  const [keIntent, setKeIntent] = useState(keDefault.intentId);
  const [keScenario, setKeScenario] = useState(keDefault.scenarioId);

  useEffect(() => {
    const q = searchParams?.get("q");
    if (q != null) setTopic(q);
  }, [searchParams]);

  useEffect(() => {
    const vi = searchParams?.get("v186_intent");
    const vs = searchParams?.get("v186_scenario");
    setKeIntent(vi || keDefault.intentId);
    setKeScenario(vs || keDefault.scenarioId);
  }, [searchParams, keDefault.intentId, keDefault.scenarioId]);

  useEffect(() => {
    initTikTokChainSessionOnTool("title-generator");
  }, []);

  const toolMeta = tools.find((t) => t.slug === "title-generator");
  const pageCopy = resolveToolPageCopy("title-generator", locale);
  const descriptionHero = pageCopy?.hero ?? tTitle("description");
  const useSteps = Boolean(pageCopy?.steps);
  const shellIntroProblem = useSteps ? pageCopy!.steps : undefined;
  const shellIntroAudience = useSteps ? "" : undefined;
  const zhUi = locale.startsWith("zh");
  const market = zhUi ? "cn" : "global";

  const [analysisTick, setAnalysisTick] = useState(0);
  useEffect(() => {
    const bump = () => setAnalysisTick((t) => t + 1);
    window.addEventListener("te_v191_analysis_updated", bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener("te_v191_analysis_updated", bump);
      window.removeEventListener("storage", bump);
    };
  }, []);

  const analysisStored = useMemo(() => loadCreatorAnalysis(), [analysisTick]);
  const creatorAnalysisOutput = analysisStored?.output ?? null;
  const hasCreatorAnalysis = Boolean(analysisStored);
  const analysisAppliedHint =
    !zhUi && hasCreatorAnalysis
      ? `Applied from your analysis: ${creatorAnalysisOutput?.content_issues?.[0]?.title?.trim() || "creator profile signals"}`
      : null;

  useEffect(() => {
    if (!toolMeta) return;
    trackEvent("tool_page_view", { tool_slug: toolMeta.slug, tool_category: toolMeta.category, country });
  }, [toolMeta, country]);

  function refreshUsageStatus() {
    fetch("/api/usage-status")
      .then((r) => r.json())
      .then((d) => setUsageUi(parseUsageStatusForToolUi(d as Record<string, unknown>)))
      .catch(() => {});
  }

  useEffect(() => {
    refreshUsageStatus();
  }, []);

  async function generateTitles() {
    const hadPrior = titles.length > 0;
    const trimmed = topic.trim();
    const v186En = !zhUi;
    if (!v186En && !trimmed) {
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
    setContentId(null);
    setV193ResultHint(null);
    setV193ChainBadge(false);

    const urlSummary = searchParams?.get("creatorAnalysisSummary")?.trim();
    const analysisStored = loadCreatorAnalysis();
    const creatorAnalysisSummary =
      v186En && urlSummary && urlSummary.length > 0
        ? urlSummary.slice(0, 2400)
        : v186En && analysisStored
          ? buildCreatorAnalysisSummaryForPrompt(
              analysisStored.output,
              [analysisStored.input.niche, analysisStored.input.bio ?? "", analysisStored.input.positioning ?? ""].join("\n")
            )
          : undefined;

    const aiPrompt = aiPrompts["title-generator"];
    let inputForModel = trimmed;
    if (v186En) {
      const built = buildV186PromptPrefixForPlainGenerateWithMeta("title-generator", keIntent, keScenario, trimmed, {
        platform: inferPlatformFromToolSlug("title-generator"),
        userProfile: {
          monetizationMode: getMonetizationModeForKnowledgeEngine(),
          primaryGoal: inferCreatorProfile(loadCreatorMemory()).primary_goal
        },
        creatorAnalysisSummary: creatorAnalysisSummary ?? null
      });
      inputForModel = built.promptPrefix;
      setV193ResultHint(built.v193Applied ? "Adjusted using recent TikTok content patterns." : null);
      setV193ChainBadge(
        built.v193Applied &&
          Boolean(built.v193ChainRules) &&
          ["hook-generator", "tiktok-caption-generator", "hashtag-generator", "title-generator"].includes(
            "title-generator"
          )
      );
    }
    let results: string[];
    let runContentId: string | null = null;
    if (aiPrompt) {
      try {
        const prompt = aiPrompt.replace(/\{input\}/g, inputForModel);
        const gen = await generateAIText(prompt, {
          locale,
          toolSlug: toolMeta?.slug ?? "title-generator"
        });
        results = gen.results;
        runContentId = gen.content_id;
        setContentId(runContentId);
        refreshUsageStatus();
        if (toolMeta) {
          trackEvent("tool_generate_ai", { tool_slug: toolMeta.slug, tool_category: toolMeta.category, input_length: trimmed.length, country });
        }
      } catch (err) {
        if (err instanceof LimitReachedError) {
          refreshUsageStatus();
          setLimitModalOpen(true);
          setIsGenerating(false);
          return;
        }
        results = generateTitleTemplate(trimmed);
        runContentId =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `c-${Date.now()}-${Math.random()}`;
        setContentId(runContentId);
        void fetch("/api/content-memory/content-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content_id: runContentId,
            anonymous_id: localStorage.getItem("te_v187_anon_id") ?? `anon-${Date.now()}`,
            tool_type: "title",
            platform: "tiktok",
            input_text: trimmed,
            generated_output: results,
            chain_session_id: readV195ChainSessionId()
          })
        }).catch(() => {});
        if (toolMeta) {
          trackEvent("tool_generate_ai_fallback", {
            tool_slug: toolMeta.slug,
            tool_category: toolMeta.category,
            country
          });
        }
      }
    } else {
      results = generateTitleTemplate(trimmed);
      runContentId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `c-${Date.now()}-${Math.random()}`;
      setContentId(runContentId);
      if (toolMeta) trackEvent("tool_generate", { tool_slug: toolMeta.slug, tool_category: toolMeta.category });
    }

    // V96: output usability — keep titles deduped and directly usable.
    results = normalizeTitleCandidates(results);
    const cse = applyContentSafetyToStringArray(results, market);
    results = cse.parts;

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
      if (runContentId) {
        recordGenerationComplete(toolMeta.slug, {
          wasRegenerate: hadPrior,
          inputPreview: trimmed,
          contentId: runContentId
        });
      }
      if (v186En) {
        recordV187V186Context(keIntent, keScenario);
      }
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
      <ReadyToPostModal
        open={readyPostOpen}
        onClose={() => setReadyPostOpen(false)}
        platform={defaultUploadPlatformForTool("title-generator")}
        toolSlug="title-generator"
      />
      <LimitReachedModal open={limitModalOpen} onClose={() => setLimitModalOpen(false)} />
      <LoginPromptModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
      <ToolPageShell
      eyebrow={tTool("eyebrow")}
      title={tTitle("title")}
      description={descriptionHero}
      introProblem={shellIntroProblem}
      introAudience={shellIntroAudience}
      locale={locale}
      input={
        <ToolInputCard label={tTitle("inputLabel")}>
          <TikTokChainProgressHint toolSlug="title-generator" />
          <ToolUsageStatusHints zhUi={zhUi} ui={usageUi} />
          {!zhUi ? (
            hasCreatorAnalysis && creatorAnalysisOutput ? (
              <CreatorAnalysisInsightCard output={creatorAnalysisOutput} />
            ) : (
              <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">Run your first content analysis to unlock smarter generation</p>
                <DelegatedButton
                  onClick={() => router.push("/creator-analysis")}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                >
                  Run analysis <span className="text-slate-400">→</span>
                </DelegatedButton>
              </div>
            )
          ) : null}
          {!zhUi ? <CreatorScoreCard toolSlug="title-generator" locale={locale} /> : null}
          {!zhUi ? <CreatorMonetizationCard toolSlug="title-generator" locale={locale} /> : null}
          {!zhUi ? (
            <CreatorTakeoverGuidance
              toolSlug="title-generator"
              intentId={keIntent}
              scenarioId={keScenario}
              topicHint={topic.trim()}
              locale={locale}
              onPrimaryGenerate={() => void generateTitles()}
              isGenerating={isGenerating}
            />
          ) : null}
          {!zhUi ? (
            <CreatorKnowledgeEnginePanel
              toolSlug="title-generator"
              intentId={keIntent}
              scenarioId={keScenario}
              onIntentChange={setKeIntent}
              onScenarioChange={setKeScenario}
              locale={locale}
            />
          ) : null}
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

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-900">Preview (titles you can paste)</p>
            <ul className="mt-2 space-y-2 text-xs text-slate-800">
              <li className="rounded-lg border border-slate-200 bg-white px-3 py-2">1) Stop scrolling: the truth about {`{your niche}`}</li>
              <li className="rounded-lg border border-slate-200 bg-white px-3 py-2">2) How to get better results in 30 minutes a day (without burning out)</li>
              <li className="rounded-lg border border-slate-200 bg-white px-3 py-2">3) The simplest title formula for {`{your audience}`}</li>
            </ul>
          </div>

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
        <>
          {!zhUi && titles.length > 0 && analysisAppliedHint ? (
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-[12px] text-slate-700">
              {analysisAppliedHint}
            </div>
          ) : null}
          {!zhUi && titles.length > 0 && v193ResultHint ? (
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-[12px] text-slate-700">
              {v193ResultHint}
            </div>
          ) : null}
          {!zhUi && titles.length > 0 && v193ChainBadge ? (
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
              <TikTokChainBadge compact />
            </div>
          ) : null}
          {!zhUi && titles.length > 0 ? (
            <>
              <CreatorScoreCard toolSlug="title-generator" variant="compact" locale={locale} />
              <CreatorMonetizationCard toolSlug="title-generator" variant="compact" locale={locale} />
              <WorkflowNextStepCard
                toolSlug="title-generator"
                hasResults={titles.length > 0}
                intentId={keIntent}
                scenarioId={keScenario}
                topicHint={topic.trim()}
                locale={locale}
              />
              <V186ContextStrip
                toolSlug="title-generator"
                intentId={keIntent}
                scenarioId={keScenario}
                locale={locale}
              />
            </>
          ) : null}
          <ToolResultListCard
            title={tTitle("resultTitle")}
            items={titles}
            isLoading={isGenerating}
            input={topic}
            onCopyItem={handleCopyItem}
            onCopyAll={handleCopyAll}
            onAfterSuccessfulCopy={!zhUi ? () => setReadyPostOpen(true) : undefined}
            onCopyTrack={(index) => {
              if (!toolMeta) return;
              if (!contentId) return;
              trackEvent("tool_copy", { tool_slug: toolMeta.slug, tool_category: toolMeta.category, country });
              logOutputCopy(toolMeta.slug, mapListCopyToResultType(toolMeta.slug, index), contentId);
            }}
            onRegenerate={generateTitles}
            onSaveEditedItem={handleSaveEditedItem}
            onItemsChange={handleItemsChange}
            emptyMessage={tTitle("emptyMessage")}
            toolSlug="title-generator"
            toolName={tTitle("title")}
            isLoggedIn={isLoggedIn}
            onRequireLogin={() => setLoginModalOpen(true)}
          />
        </>
      }
      howItWorks={
        <HowItWorksCard
          title={zhUi ? "怎么用" : "How it works"}
          steps={[
            { step: 1, text: tTitle("howItWorks1") },
            { step: 2, text: tTitle("howItWorks2") },
            { step: 3, text: tTitle("howItWorks3") }
          ]}
        />
      }
      proTips={
        <ToolProTipsCard
          title={zhUi ? "进阶技巧" : "Pro tips"}
          tips={[tTitle("proTip1"), tTitle("proTip2"), tTitle("proTip3")]}
        />
      }
      extraSections={[
        {
          title: zhUi ? "历史生成记录" : "Generation history",
          content: <HistoryPanel toolSlug="title-generator" refreshTrigger={historyTrigger} />
        },
        {
          title: zhUi ? "输入示例" : "Input examples",
          content: (
            <ExamplesCard examples={TITLE_EXAMPLES} onUseExample={(input) => setTopic(input)} />
          )
        },
        ...(ctaLinks && ctaLinks.length > 0
          ? [
              {
                title: zhUi ? "延伸阅读" : "Further reading",
                content: <CtaLinksSection links={ctaLinks} />
              }
            ]
          : []),
        ...(showZhInlineLead
          ? [
              {
                title: zhUi ? "获取更多灵感" : "Get more ideas",
                content: <ZhCtaCaptureBlock keyword="爆款标题" inline />
              }
            ]
          : []),
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
