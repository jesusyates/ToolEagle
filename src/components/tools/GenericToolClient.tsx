"use client";

import { ReactNode, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { trackEvent } from "@/lib/analytics";
import { safeCopyToClipboard } from "@/lib/clipboard";
import { addToHistory, incrementToolUsage } from "@/lib/storage";
import { tools } from "@/config/tools";
import { generators } from "@/config/generators";
import { aiPrompts, MAX_INPUT_LENGTH } from "@/config/prompts";
import { generateAIText, LimitReachedError } from "@/lib/ai/generateText";
import { applyContentSafetyToStringArray } from "@/lib/content-safety/filter";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { ToolInputCard } from "@/components/tools/ToolInputCard";
import { ToolResultListCard } from "@/components/tools/ToolResultListCard";
import { HistoryPanel } from "@/components/tools/HistoryPanel";
import { HowItWorksCard } from "@/components/tools/HowItWorksCard";
import { ExamplesCard } from "@/components/tools/ExamplesCard";
import { ToolProTipsCard } from "@/components/tools/ToolProTipsCard";
import { AnswerLinksCard } from "@/components/tools/AnswerLinksCard";
import { DelegatedButton } from "@/components/DelegatedButton";
import { LimitReachedModal } from "@/components/LimitReachedModal";
import { LoginPromptModal } from "@/components/LoginPromptModal";
import { useAuth } from "@/hooks/useAuth";
import { useCountry } from "@/hooks/useCountry";
import { getEnToolJourney } from "@/config/en-tool-journey";
import { resolveToolPageCopy } from "@/config/tool-page-copy-resolve";
import { ToolNextSteps } from "@/components/tools/ToolNextSteps";
import { CopyPublishModal } from "@/components/tools/CopyPublishModal";
import { getPublishUrlForToolSlug } from "@/lib/tools/tool-publish-platform";
import { logOutputCopy, mapListCopyToResultType, recordGenerationComplete } from "@/lib/tool-output-quality";
import { parseUsageStatusForToolUi, type UsageStatusUiSlice } from "@/lib/usage-status-client";
import { ToolUsageStatusHints } from "@/components/tools/ToolUsageStatusHints";
import { CreatorGuidanceCard } from "@/components/tools/CreatorGuidanceCard";
import { CreatorScoreCard } from "@/components/tools/CreatorScoreCard";
import { CreatorMonetizationCard } from "@/components/tools/CreatorMonetizationCard";

type GenericToolClientProps = {
  slug: string;
  relatedAside?: ReactNode;
};

function resolveToolMarket(slug: string, locale: string): "cn" | "global" {
  if (slug.startsWith("douyin-")) return "cn";
  return locale.startsWith("zh") ? "cn" : "global";
}

/** V175 — attribute copy events to blog when user arrived from /blog/… */
function blogSlugFromDocumentReferrer(): string | null {
  if (typeof document === "undefined") return null;
  try {
    const ref = document.referrer;
    if (!ref) return null;
    const u = new URL(ref);
    if (u.pathname.startsWith("/blog/")) {
      const m = u.pathname.match(/^\/blog\/([^/]+)/);
      return m?.[1] ?? null;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function GenericToolClient({ slug, relatedAside }: GenericToolClientProps) {
  const [input, setInput] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [contentId, setContentId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [historyTrigger, setHistoryTrigger] = useState(0);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [usageUi, setUsageUi] = useState<UsageStatusUiSlice>({
    cnBilling: null,
    cnCreditsRemaining: null,
    cnCreditsDaysLeft: null,
    usageRemaining: null
  });
  const { isLoggedIn } = useAuth();
  const t = useTranslations("common");
  const locale = useLocale();
  const country = useCountry();

  const toolMeta = tools.find((t) => t.slug === slug);
  const config = generators[slug];

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

  if (!toolMeta || !config) return null;

  const enJourney = locale === "en" ? getEnToolJourney(slug) : null;
  const pageCopy = resolveToolPageCopy(slug, locale);
  const descriptionHero =
    pageCopy?.hero ??
    (locale.startsWith("zh") && toolMeta.descriptionZh ? toolMeta.descriptionZh : toolMeta.description);
  const useStepsOnly = Boolean(pageCopy?.steps);
  const shellIntroProblem = useStepsOnly
    ? pageCopy!.steps
    : locale === "en"
      ? enJourney?.introProblem
      : undefined;
  const shellIntroAudience = useStepsOnly ? "" : locale === "en" ? enJourney?.introAudience : undefined;
  const primaryCtaLabel = enJourney?.generateCta ?? config.buttonLabel;
  const zhUi = locale.startsWith("zh");

  async function handleGenerate() {
    const hadPrior = items.length > 0;
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
    setContentId(null);

    const aiPrompt = aiPrompts[slug];
    const market = resolveToolMarket(slug, locale);
    let results: string[];
    let runContentId: string | null = null;
    if (aiPrompt) {
      try {
        const prompt = aiPrompt.replace(/\{input\}/g, trimmed);
        const gen = await generateAIText(prompt, { locale, toolSlug: toolMeta?.slug ?? slug });
        results = gen.results;
        runContentId = gen.content_id;
        setContentId(runContentId);
        refreshUsageStatus();
        if (toolMeta) {
          trackEvent("tool_generate_ai", {
            tool_slug: toolMeta.slug,
            tool_category: toolMeta.category,
            input_length: trimmed.length,
            country
          });
        }
      } catch (err) {
        if (err instanceof LimitReachedError) {
          refreshUsageStatus();
          setLimitModalOpen(true);
          setIsGenerating(false);
          return;
        }
        results = config.generate(trimmed);
        runContentId =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `c-${Date.now()}-${Math.random()}`;
        setContentId(runContentId);
        if (toolMeta) {
          trackEvent("tool_generate_ai_fallback", {
            tool_slug: toolMeta.slug,
            tool_category: toolMeta.category,
            country
          });
        }
      }
    } else {
      results = config.generate(trimmed);
      runContentId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `c-${Date.now()}-${Math.random()}`;
      setContentId(runContentId);
      if (toolMeta) {
      trackEvent("tool_generate", { tool_slug: toolMeta.slug, tool_category: toolMeta.category, country });
      }
    }

    // Enforce the same safety pass on all user-visible outputs (AI and template generators).
    const cse = applyContentSafetyToStringArray(results, market);
    results = cse.parts;

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
      trackEvent("tool_generate", {
        tool_slug: toolMeta.slug,
        market,
        locale,
        content_safety_filtered: cse.filteredCount,
        content_safety_risk_detected: cse.riskDetected,
        content_safety_profile: cse.profile
      });
      setHistoryTrigger((t) => t + 1);
        if (runContentId) {
          recordGenerationComplete(toolMeta.slug, {
            wasRegenerate: hadPrior,
            inputPreview: trimmed,
            contentId: runContentId
          });
        }
    }
  }

  async function handleCopyItem(index: number) {
    const text = items[index];
    if (!text) return;
    await safeCopyToClipboard(text);
  }

  async function handleCopyAll() {
    if (items.length === 0) return;
    const text = items.join("\n\n---\n\n");
    await safeCopyToClipboard(text);
  }

  function handleAfterSuccessfulCopy() {
    if (!toolMeta) return;
    trackEvent("copy_click", {
      tool_slug: toolMeta.slug,
      tool_category: toolMeta.category,
      country,
      locale,
      market: resolveToolMarket(slug, locale)
    });
    const enSurface = locale === "en" || locale.startsWith("en-");
    if (enSurface && items.length > 0) {
      trackEvent("copy_modal_shown", {
        tool_slug: toolMeta.slug,
        tool_category: toolMeta.category,
        country,
        locale
      });
      setPublishModalOpen(true);
    }
  }

  async function handleSaveEditedItem(index: number, newText: string) {
    if (!toolMeta) return;
    const updated = [...items];
    updated[index] = newText;
    setItems(updated);
    if (!isLoggedIn) {
      setLoginModalOpen(true);
      return;
    }
    addToHistory({
      toolSlug: toolMeta.slug,
      toolName: toolMeta.name,
      input,
      items: updated
    });
    setHistoryTrigger((prev) => prev + 1);
    await fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        toolSlug: toolMeta.slug,
        toolName: toolMeta.name,
        input,
        items: updated
      })
    });
  }

  function handleItemsChange(index: number, newText: string) {
    const updated = [...items];
    updated[index] = newText;
    setItems(updated);
  }

  return (
    <>
      <CopyPublishModal
        open={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        publishUrl={
          locale === "en" || locale.startsWith("en-") ? getPublishUrlForToolSlug(slug) : null
        }
        toolSlug={slug}
      />
      <LimitReachedModal open={limitModalOpen} onClose={() => setLimitModalOpen(false)} />
      <LoginPromptModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
      <ToolPageShell
      title={toolMeta.name}
      description={descriptionHero}
      introProblem={shellIntroProblem}
      introAudience={shellIntroAudience}
      locale={locale}
      input={
        <ToolInputCard label={config.inputLabel}>
          <ToolUsageStatusHints zhUi={zhUi} ui={usageUi} />
          {!zhUi ? <CreatorScoreCard toolSlug={slug} locale={locale} /> : null}
          {!zhUi ? <CreatorMonetizationCard toolSlug={slug} locale={locale} /> : null}
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
                {primaryCtaLabel}
                <span className="text-slate-400">→</span>
              </>
            )}
          </DelegatedButton>
        </ToolInputCard>
      }
      result={
        <>
          {!zhUi ? <CreatorScoreCard toolSlug={slug} variant="compact" locale={locale} /> : null}
          {!zhUi ? <CreatorMonetizationCard toolSlug={slug} variant="compact" locale={locale} /> : null}
          {!zhUi ? <CreatorGuidanceCard toolSlug={slug} variant="above_result" locale={locale} /> : null}
          <ToolResultListCard
            title={config.resultTitle}
            items={items}
            isLoading={isGenerating}
            input={input}
            onCopyItem={handleCopyItem}
            onCopyAll={handleCopyAll}
            onAfterSuccessfulCopy={handleAfterSuccessfulCopy}
            onCopyTrack={(index) => {
              if (!toolMeta) return;
              if (!contentId) return;
              trackEvent("tool_copy", { tool_slug: toolMeta.slug, tool_category: toolMeta.category, country });
              fetch("/api/analytics/tool-funnel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  type: "tool_copy",
                  toolSlug: toolMeta.slug,
                  sourceSlug: blogSlugFromDocumentReferrer(),
                  ts: new Date().toISOString()
                })
              }).catch(() => {});
              if (index >= 0) {
                logOutputCopy(toolMeta.slug, mapListCopyToResultType(toolMeta.slug, index), contentId);
              }
            }}
            onRegenerate={handleGenerate}
            onSaveEditedItem={handleSaveEditedItem}
            onItemsChange={handleItemsChange}
            emptyMessage={config.emptyMessage}
            toolSlug={slug}
            toolName={toolMeta.name}
            isLoggedIn={isLoggedIn}
            onRequireLogin={() => setLoginModalOpen(true)}
          />
          {locale === "en" ? (
            <ToolNextSteps toolSlug={slug} hasOutput={items.length > 0} />
          ) : null}
        </>
      }
      howItWorks={
        <HowItWorksCard
          steps={config.howItWorks}
          title={zhUi ? "怎么用" : "How it works"}
        />
      }
      proTips={<ToolProTipsCard tips={config.proTips} title={zhUi ? "进阶技巧" : "Pro tips"} />}
      extraSections={[
        {
          title: zhUi ? "历史生成记录" : "Generation history",
          content: <HistoryPanel toolSlug={slug} refreshTrigger={historyTrigger} />
        },
        {
          title: zhUi ? "输入示例" : "Input examples",
          content: <ExamplesCard examples={config.examples} onUseExample={(i) => setInput(i)} />
        },
        {
          title: zhUi ? "相关问题" : "Related questions",
          content: <AnswerLinksCard toolSlug={slug} limit={3} />
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
