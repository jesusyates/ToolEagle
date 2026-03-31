"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { trackEvent } from "@/lib/analytics";
import { trackConversion } from "@/lib/analytics/conversionClient";
import { addToHistory, incrementToolUsage } from "@/lib/storage";
import { tools } from "@/config/tools";
import { MAX_INPUT_LENGTH } from "@/config/prompts";
import {
  generatePostPackages,
  CreditsDepletedError,
  type ContentSafetyClientMeta
} from "@/lib/ai/generatePostPackage";
import { LimitReachedError } from "@/lib/ai/generateText";
import type { CreatorPostPackage, PostPackageToolKind } from "@/lib/ai/postPackage";
import type { LockedPackagePreview } from "@/lib/ai/packageTierSplit";
import { DelegatedButton } from "@/components/DelegatedButton";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { ToolInputCard } from "@/components/tools/ToolInputCard";
import { PostPackageResults } from "@/components/tools/PostPackageResults";
import { HistoryPanel } from "@/components/tools/HistoryPanel";
import { HowItWorksCard } from "@/components/tools/HowItWorksCard";
import { ToolProTipsCard } from "@/components/tools/ToolProTipsCard";
import { LimitReachedModal } from "@/components/LimitReachedModal";
import { useCountry } from "@/hooks/useCountry";
import { formatPackageAsPlainText, PACKAGE_SECTION_LABELS } from "@/lib/ai/postPackage";
import { PACKAGE_SECTION_LABELS_ZH } from "@/lib/zh-site/packageLabels";
import { StructuredExamplesLibrary } from "@/components/value/StructuredExamplesLibrary";
import { ValueProofBlock } from "@/components/value/ValueProofBlock";
import { CtaLinksSection } from "@/components/tools/CtaLinksSection";
import { BASE_URL } from "@/config/site";
import { ZhDouyinCreditsBar } from "@/components/zh/ZhDouyinCreditsBar";
import { getEnToolJourney } from "@/config/en-tool-journey";
import { ToolNextSteps } from "@/components/tools/ToolNextSteps";
import { recordGenerationComplete } from "@/lib/tool-output-quality";
import { parseUsageStatusForToolUi } from "@/lib/usage-status-client";
import { parseToolPrefillParams } from "@/lib/tools/tool-prefill";
import { trackGenerationStart, trackToolEntry } from "@/lib/seo/asset-seo-conversion-tracking";
import { computeMonetizationPotential } from "@/lib/seo/asset-seo-monetization-score";
import { deriveMonetizationTrigger, type MonetizationTrigger } from "@/lib/seo/asset-seo-monetization-trigger";
import { trackUpgradeClicked, trackUpgradeConverted, trackUpgradeShown } from "@/lib/seo/asset-seo-monetization-tracking";
import { pickVariantDeterministic, variantsForTrigger, type MonetizationVariant } from "@/lib/seo/asset-seo-monetization-variants";
import { selectWinningVariant, type MonetizationIntelligence } from "@/lib/seo/asset-seo-monetization-decision";
import type { AssetSeoRevenueSummaryArtifact } from "@/lib/seo/asset-seo-revenue-summary";
import { selectCtaVariantWithRevenueContext } from "@/lib/seo/asset-seo-cta-optimizer";
import {
  computeConversionPathAmplification,
  logConversionPathRevenueAmplification
} from "@/lib/seo/asset-seo-conversion-path";
import { logAssetSeoConversionFeedback } from "@/lib/seo/asset-seo-telemetry";
import {
  applyRuntimeMonetizationTriggerBias,
  buildRuntimeSegmentStrategy
} from "@/lib/seo/asset-seo-segment-strategy-runtime";
import {
  escalationPreferredTriggerType,
  escalationTimingOffset
} from "@/lib/seo/asset-seo-intent-escalation";
import { buildRuntimeIntentEscalationPlan } from "@/lib/seo/asset-seo-intent-escalation-runtime";
import { logAssetSeoIntentEscalation } from "@/lib/seo/asset-seo-telemetry";
import { CreatorKnowledgeEnginePanel } from "@/components/tools/CreatorKnowledgeEnginePanel";
import { CreatorAnalysisInsightCard } from "@/components/tools/CreatorAnalysisInsightCard";
import { CreatorTakeoverGuidance } from "@/components/tools/CreatorTakeoverGuidance";
import { CreatorScoreCard } from "@/components/tools/CreatorScoreCard";
import { CreatorMonetizationCard } from "@/components/tools/CreatorMonetizationCard";
import { WorkflowNextStepCard } from "@/components/tools/WorkflowNextStepCard";
import { V186ContextStrip } from "@/components/tools/V186ContextStrip";
import { TikTokChainProgressHint } from "@/components/tools/TikTokChainProgressHint";
import { initTikTokChainSessionOnTool, isTikTokChainToolSlug } from "@/lib/tiktok-chain-tracking";
import { loadCreatorMemory, recordV187V186Context } from "@/lib/creator-guidance/creator-memory-store";
import { inferCreatorProfile } from "@/lib/creator-guidance/infer-creator-profile";
import { getMonetizationModeForKnowledgeEngine, getMonetizationProfileForTool } from "@/lib/creator-guidance/infer-monetization-profile";
import { inferPlatformFromToolSlug } from "@/lib/platform-intelligence/resolve-patterns";
import { loadCreatorAnalysis } from "@/lib/creator-analysis/storage";
import { buildCreatorAnalysisSummaryForPrompt } from "@/lib/creator-analysis/to-downstream";
import assets from "@/config/creator-knowledge-engine/v186-assets.json";
import monetizationCopyMap from "../../../generated/v190.1-monetization-copy-map.json";

const LIFETIME_GEN_KEY = "te_v96_lifetime_pkg_gens";
const MONETIZATION_VARIANT_STATS_KEY = "te_monetization_variant_stats";
const MONETIZATION_TIMING_STATS_KEY = "te_monetization_timing_stats";
const MONETIZATION_SERVER_INTEL = "/generated/asset-seo-monetization-intelligence.json";
const REVENUE_SUMMARY_URL = "/generated/asset-seo-revenue-summary.json";

export type PostPackageToolClientProps = {
  toolSlug: string;
  toolKind: PostPackageToolKind;
  /** V105.1 — merge over default zh section titles (Douyin tools with remapped fields) */
  packageLabelsZh?: Partial<Record<keyof CreatorPostPackage, string>>;
  eyebrow?: string;
  title: string;
  description: string;
  tryExample: string;
  inputLabel: string;
  placeholder: string;
  generateButtonLabel: string;
  resultTitle: string;
  emptyMessage: string;
  howItWorksSteps: { step: number; text: string }[];
  proTips: string[];
  examplesCategory: "tiktok_caption" | "hook" | "ai_caption";
  valueProofVariant: "caption" | "hook" | "ai_caption";
  relatedAside?: ReactNode;
  /** e.g. zh pages — affiliate / deep links */
  ctaLinks?: { href: string; label: string }[];
  /** e.g. tiktok caption reads ?q= */
  seedFromQueryParam?: string;
  /** V97.1 — China-local UI, zh API locale, /zh/pricing upgrade path */
  siteMode?: "global" | "china";
  /** Overrides EN journey intro in ToolPageShell; CN: shown as 操作步骤 under the description */
  introProblem?: string;
  introAudience?: string;
  /** V99 — show a visible output preview before the first generation */
  outputPreview?: ReactNode;
  /** V186 — Creator Knowledge Engine (intent + scenario + weighted retrieval upstream of generate-package) */
  creatorKnowledgeEngine?: boolean;
};

export function PostPackageToolClient({
  toolSlug,
  toolKind,
  eyebrow,
  title,
  description,
  tryExample,
  inputLabel,
  placeholder,
  generateButtonLabel,
  resultTitle,
  emptyMessage,
  howItWorksSteps,
  proTips,
  examplesCategory,
  valueProofVariant,
  relatedAside,
  ctaLinks,
  seedFromQueryParam = "q",
  siteMode = "global",
  packageLabelsZh,
  introProblem: introProblemProp,
  introAudience: introAudienceProp,
  outputPreview,
  creatorKnowledgeEngine = false
}: PostPackageToolClientProps) {
  function bumpVariantStat(variantId: string, field: "shown" | "clicked" | "converted") {
    try {
      const raw = localStorage.getItem(MONETIZATION_VARIANT_STATS_KEY);
      const obj = raw ? (JSON.parse(raw) as Record<string, { shown: number; clicked: number; converted: number }>) : {};
      obj[variantId] = obj[variantId] ?? { shown: 0, clicked: 0, converted: 0 };
      obj[variantId][field] += 1;
      localStorage.setItem(MONETIZATION_VARIANT_STATS_KEY, JSON.stringify(obj));
    } catch {}
  }

  function computeWinnerVariant(triggerType: "soft" | "hard"): string | null {
    try {
      const raw = localStorage.getItem(MONETIZATION_VARIANT_STATS_KEY);
      const obj = raw ? (JSON.parse(raw) as Record<string, { shown: number; clicked: number; converted: number }>) : {};
      const ids = variantsForTrigger(triggerType).map((v) => v.id);
      const scored = ids.map((id) => {
        const s = obj[id] ?? { shown: 0, clicked: 0, converted: 0 };
        const cr = s.shown > 0 ? s.converted / s.shown : 0;
        const ctr = s.shown > 0 ? s.clicked / s.shown : 0;
        return { id, score: cr * 0.7 + ctr * 0.3 };
      });
      const winner = scored.sort((a, b) => b.score - a.score)[0]?.id ?? null;
      if (winner) localStorage.setItem(`te_monetization_winner_variant_${triggerType}`, winner);
      return winner;
    } catch {
      return null;
    }
  }

  function bumpTimingStat(generationCountBeforeConversion: number) {
    try {
      const timing = Math.max(1, Math.min(3, Math.round(generationCountBeforeConversion)));
      const raw = localStorage.getItem(MONETIZATION_TIMING_STATS_KEY);
      const obj = raw ? (JSON.parse(raw) as Record<string, number>) : {};
      obj[String(timing)] = (obj[String(timing)] ?? 0) + 1;
      localStorage.setItem(MONETIZATION_TIMING_STATS_KEY, JSON.stringify(obj));
      const best = Number(Object.entries(obj).sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] ?? 2);
      localStorage.setItem("te_monetization_best_timing", String(best));
      trackEvent("trigger_timing_optimized", { tool_slug: toolSlug, page_type: String(best) } as any);
    } catch {}
  }

  const intlLocale = useLocale();
  const locale = siteMode === "china" ? "zh" : intlLocale;
  const country = useCountry();
  const pathname = usePathname() || "";
  const searchParams = useSearchParams() ?? new URLSearchParams();
  const router = useRouter();
  const prefill = parseToolPrefillParams(searchParams);
  const q = searchParams.get(seedFromQueryParam) ?? "";
  const initialIdea = prefill.topic ?? q;
  const [idea, setIdea] = useState(initialIdea);
  const keDefault = useMemo(() => {
    const intents = assets.intent_chips[toolSlug as keyof typeof assets.intent_chips];
    const sc = assets.scenario_chips[toolSlug as keyof typeof assets.scenario_chips];
    return {
      intentId: intents?.[0]?.id ?? "intent_views",
      scenarioId: sc?.[0]?.id ?? "sc_tutorial"
    };
  }, [toolSlug]);
  const [keIntent, setKeIntent] = useState(keDefault.intentId);
  const [keScenario, setKeScenario] = useState(keDefault.scenarioId);
  useEffect(() => {
    const vi = searchParams.get("v186_intent");
    const vs = searchParams.get("v186_scenario");
    setKeIntent(vi || keDefault.intentId);
    setKeScenario(vs || keDefault.scenarioId);
  }, [searchParams, toolSlug, keDefault.intentId, keDefault.scenarioId]);

  useEffect(() => {
    if (isTikTokChainToolSlug(toolSlug)) initTikTokChainSessionOnTool(toolSlug);
  }, [toolSlug]);

  const [packages, setPackages] = useState<CreatorPostPackage[]>([]);
  const [contentId, setContentId] = useState<string | null>(null);
  const [lockedPreview, setLockedPreview] = useState<LockedPackagePreview[]>([]);
  const [tierApplied, setTierApplied] = useState<"free" | "pro">("free");
  const [resultQuality, setResultQuality] = useState<"compact_post_package" | "full_post_package">(
    "compact_post_package"
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [historyTrigger, setHistoryTrigger] = useState(0);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [lifetimeGenCount, setLifetimeGenCount] = useState(0);
  const [usageRemaining, setUsageRemaining] = useState<number | null>(null);
  /** V107 — CN credits vs free daily */
  const [cnBilling, setCnBilling] = useState<"free" | "credits" | "legacy_pro" | null>(null);
  const [cnCreditsRemaining, setCnCreditsRemaining] = useState<number | null>(null);
  const [cnCreditsDaysLeft, setCnCreditsDaysLeft] = useState<number | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [contentSafety, setContentSafety] = useState<ContentSafetyClientMeta | null>(null);
  /** V106.1 — merged publish pack (default on for CN) */
  const [publishFullPack, setPublishFullPack] = useState(siteMode === "china");
  const [publishFullPackEcho, setPublishFullPackEcho] = useState(false);
  const [monetizationTrigger, setMonetizationTrigger] = useState<MonetizationTrigger | null>(null);
  const [monetizationVariant, setMonetizationVariant] = useState<MonetizationVariant | null>(null);
  const [serverIntelligence, setServerIntelligence] = useState<MonetizationIntelligence | null>(null);
  const [revenueSummary, setRevenueSummary] = useState<AssetSeoRevenueSummaryArtifact | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const zhSite = siteMode === "china";

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
  const primaryIssueTitle = (!zhSite ? creatorAnalysisOutput?.content_issues?.[0]?.title?.trim() : "") ?? "";
  const hasCreatorAnalysis = Boolean(analysisStored);
  const analysisAppliedHint =
    !zhSite && hasCreatorAnalysis
      ? `Applied from your analysis: ${primaryIssueTitle || "creator profile signals"}`
      : null;

  const monetizationUsageHint = useMemo(() => {
    if (zhSite) return null;
    try {
      const p = getMonetizationProfileForTool(toolSlug);
      return (monetizationCopyMap.result_usage_hints as any)[p.current_focus] ?? null;
    } catch {
      return null;
    }
  }, [zhSite, toolSlug, analysisTick]);

  /** V193.1 — only after a successful generate when server applied TikTok observations */
  const [v193ResultHint, setV193ResultHint] = useState<string | null>(null);
  const [v193ChainBadge, setV193ChainBadge] = useState<boolean>(false);

  const resultsAnchorRef = useRef<HTMLDivElement | null>(null);

  const hookFixPrimaryLabelOverride =
    toolKind === "hook_focus" && !zhSite
      ? primaryIssueTitle
        ? `Fix your ${primaryIssueTitle.length > 28 ? `${primaryIssueTitle.slice(0, 26)}...` : primaryIssueTitle}`
        : "Generate hooks"
      : undefined;

  const toolMeta = tools.find((t) => t.slug === toolSlug);

  useEffect(() => {
    const n = parseInt(
      typeof window !== "undefined" ? localStorage.getItem(LIFETIME_GEN_KEY) || "0" : "0",
      10
    );
    setLifetimeGenCount(n);
  }, []);

  function applyUsageStatusPayload(d: Record<string, unknown>) {
    const m = parseUsageStatusForToolUi(d);
    setCnBilling(m.cnBilling);
    if (typeof d.creditsRemaining === "number") setCnCreditsRemaining(d.creditsRemaining);
    setCnCreditsDaysLeft(m.cnCreditsDaysLeft);
    setUsageRemaining(m.usageRemaining);
    if (typeof d.authenticated === "boolean") setAuthenticated(d.authenticated);
  }

  useEffect(() => {
    fetch("/api/usage-status")
      .then((r) => r.json())
      .then((d) => applyUsageStatusPayload(d as Record<string, unknown>))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(MONETIZATION_SERVER_INTEL, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d === "object") {
          setServerIntelligence(d as MonetizationIntelligence);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(REVENUE_SUMMARY_URL, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d === "object" && typeof (d as AssetSeoRevenueSummaryArtifact).version === "string") {
          setRevenueSummary(d as AssetSeoRevenueSummaryArtifact);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!toolMeta) return;
    trackEvent("tool_page_view", { tool_slug: toolMeta.slug, tool_category: toolMeta.category, country });
  }, [toolMeta, country]);

  useEffect(() => {
    if (!toolMeta) return;
    if (prefill.source !== "ai_page") return;
    trackToolEntry({ tool_slug: toolMeta.slug, topic: prefill.topic ?? undefined, intent: prefill.intent ?? undefined, workflow: prefill.workflow ?? undefined, source: prefill.source ?? undefined });
    if (prefill.autostart && (prefill.topic ?? "").trim().length > 0) {
      void runGenerate();
    }
  }, [toolMeta, prefill.source, prefill.autostart]);

  async function runGenerate() {
    const hadPrior = packages.length > 0;
    const trimmed = idea.trim();
    const effectiveForApi =
      trimmed.length > 0
        ? trimmed
        : siteMode === "china" && !creatorKnowledgeEngine
          ? tryExample.trim().slice(0, MAX_INPUT_LENGTH)
          : "";
    if (!creatorKnowledgeEngine && !effectiveForApi) {
      setPackages([]);
      setLockedPreview([]);
      setContentSafety(null);
      setPublishFullPackEcho(false);
      return;
    }
    if (effectiveForApi.length > MAX_INPUT_LENGTH) {
      setPackages([]);
      setLockedPreview([]);
      setContentSafety(null);
      setPublishFullPackEcho(false);
      return;
    }

    setIsGenerating(true);
    setContentId(null);
    setGenerateError(null);
    setV193ResultHint(null);
    setV193ChainBadge(false);
    try {
      if (toolMeta && prefill.source === "ai_page") {
        trackGenerationStart({
          tool_slug: toolMeta.slug,
          topic: prefill.topic ?? effectiveForApi,
          intent: prefill.intent ?? undefined,
          workflow: prefill.workflow ?? undefined,
          source: prefill.source ?? undefined
        });
      }
      const urlSummary = searchParams.get("creatorAnalysisSummary")?.trim();
      const analysisStored = loadCreatorAnalysis();
      const creatorAnalysisSummary =
        creatorKnowledgeEngine && !zhSite
          ? urlSummary && urlSummary.length > 0
            ? urlSummary.slice(0, 2400)
            : analysisStored
              ? buildCreatorAnalysisSummaryForPrompt(
                  analysisStored.output,
                  [analysisStored.input.niche, analysisStored.input.bio ?? "", analysisStored.input.positioning ?? ""].join("\n")
                )
              : undefined
          : undefined;

      const res = await generatePostPackages(effectiveForApi, toolKind, {
        locale,
        market: siteMode === "china" ? "cn" : undefined,
        clientRoute: pathname || undefined,
        publishFullPack: siteMode === "china" ? publishFullPack : false,
        toolSlug,
        v186:
          creatorKnowledgeEngine && !zhSite
            ? {
                toolSlug,
                intentId: keIntent,
                scenarioId: keScenario,
                platform: inferPlatformFromToolSlug(toolSlug),
                monetizationMode: getMonetizationModeForKnowledgeEngine(),
                primaryGoal: inferCreatorProfile(loadCreatorMemory()).primary_goal
              }
            : undefined,
        creatorAnalysisSummary,
        attribution: prefill.source
          ? {
              entry_source: prefill.source,
              entry_intent: prefill.intent,
              topic: prefill.topic ?? effectiveForApi,
              workflow: prefill.workflow
            }
          : undefined
      });
      const shouldScrollToResults = res.packages.length > 0 && !hadPrior;
      setPackages(res.packages);
      setContentId(res.content_id);
      setLockedPreview(res.lockedPreview ?? []);
      setTierApplied(res.tierApplied);
      setResultQuality(res.resultQuality);
      setContentSafety(res.contentSafety ?? null);
      setPublishFullPackEcho(res.publishFullPack === true);
      setV193ResultHint(
        !zhSite && res.v193ObservationApplied ? "Adjusted using recent TikTok content patterns." : null
      );
      setV193ChainBadge(
        !zhSite &&
          res.v193ObservationApplied === true &&
          res.v193ChainConsistencyApplied === true &&
          ["hook-generator", "tiktok-caption-generator", "hashtag-generator", "title-generator"].includes(toolSlug)
      );

      if (shouldScrollToResults) {
        requestAnimationFrame(() => {
          resultsAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
      const nextGenerationCount = lifetimeGenCount + (res.packages.length > 0 ? 1 : 0);
      if (toolMeta) {
        trackEvent("tool_generate_ai", {
          tool_slug: toolMeta.slug,
          tool_category: toolMeta.category,
          input_length: effectiveForApi.length,
          country,
          v95_package: 1,
          content_safety_filtered: res.contentSafety?.filteredCount ?? 0,
          content_safety_risk_detected: res.contentSafety?.riskDetected ?? 0
        });
        if (toolSlug.startsWith("douyin-")) {
          trackEvent("douyin_generate", {
            tool_slug: toolMeta.slug,
            tier: res.tierApplied,
            package_count: res.packages.length,
            locked_count: res.lockedPreview?.length ?? 0,
            country
          });
          trackConversion("douyin_generate", {
            tool_slug: toolMeta.slug,
            tier: res.tierApplied,
            package_count: res.packages.length,
            locked_count: res.lockedPreview?.length ?? 0,
            market: zhSite ? "cn" : "global",
            locale
          });
        } else if (zhSite) {
          trackConversion("cn_generate", {
            tool_slug: toolMeta.slug,
            tier: res.tierApplied,
            package_count: res.packages.length,
            locked_count: res.lockedPreview?.length ?? 0,
            market: "cn",
            locale
          });
        }
      }
      if (toolMeta && res.packages.length > 0) {
        const prev = parseInt(localStorage.getItem(LIFETIME_GEN_KEY) || "0", 10);
        const next = prev + 1;
        localStorage.setItem(LIFETIME_GEN_KEY, String(next));
        setLifetimeGenCount(next);

        incrementToolUsage(toolMeta.slug);
        const labelMap =
          siteMode === "china"
            ? { ...PACKAGE_SECTION_LABELS_ZH, ...packageLabelsZh }
            : PACKAGE_SECTION_LABELS;
        const items = res.packages.map((p) => formatPackageAsPlainText(p, labelMap));
        addToHistory({
          toolSlug: toolMeta.slug,
          toolName: toolMeta.name,
          input: effectiveForApi,
          items
        });
        setHistoryTrigger((t) => t + 1);

        fetch("/api/usage-status")
          .then((r) => r.json())
          .then((d) => applyUsageStatusPayload(d as Record<string, unknown>))
          .catch(() => {});

        if (typeof res.creditsUsed === "number" && typeof res.creditsRemaining === "number") {
          trackEvent("credit_used", {
            tool_slug: toolMeta.slug,
            credits_used: res.creditsUsed,
            credit_remaining: res.creditsRemaining
          });
          trackEvent("credit_balance", {
            tool_slug: toolMeta.slug,
            credit_remaining: res.creditsRemaining
          });
        }

        recordGenerationComplete(toolSlug, {
          wasRegenerate: hadPrior,
          inputPreview: effectiveForApi,
          contentId: res.content_id
        });
        if (creatorKnowledgeEngine) {
          recordV187V186Context(keIntent, keScenario);
        }
        if (res.tierApplied === "pro") {
          trackEvent("conversion_completed", {
            tool_slug: toolMeta.slug,
            topic_slug: prefill.topic ?? effectiveForApi,
            prompt_id: prefill.workflow ?? ""
          } as any);
          trackUpgradeConverted({
            tool_slug: toolMeta.slug,
            topic: prefill.topic ?? effectiveForApi,
            workflow: prefill.workflow ?? "",
            variant_id: monetizationVariant?.id
          });
          if (monetizationVariant?.id) {
            bumpVariantStat(monetizationVariant.id, "converted");
            computeWinnerVariant(monetizationVariant.trigger_type);
          }
          bumpTimingStat(nextGenerationCount);
        }
      }
      // V151 monetization trigger: post-value, frequency-capped, non-blocking first experience.
      const mp = computeMonetizationPotential({
        conversion_score: Number((res.generationMeta as any)?.retrieval_used ? 0.5 : 0.32),
        generation_start_rate: res.packages.length > 0 ? 0.7 : 0.1,
        intent: prefill.intent ?? "wants_examples",
        retrieval_share: Number((res.generationMeta as any)?.retrieval_used ? 0.6 : 0.35)
      });
      const retrievalUsed = Boolean((res.generationMeta as { retrieval_used?: boolean })?.retrieval_used);
      const lifetimeAfterSuccess = lifetimeGenCount + (res.packages.length > 0 ? 1 : 0);
      const lane = locale.startsWith("zh") ? "zh" : "en";
      const monetizationStrategy = selectWinningVariant({
        intelligence: serverIntelligence,
        topic: prefill.topic ?? effectiveForApi,
        workflow_id: prefill.workflow ?? toolKind,
        min_samples: 10
      });
      const bestTiming =
        monetizationStrategy.best_trigger_timing ??
        (Number(localStorage.getItem("te_monetization_best_timing") || "2") as 1 | 2 | 3);
      const intentPlan = buildRuntimeIntentEscalationPlan({
        lane,
        topic: prefill.topic ?? effectiveForApi,
        workflow_id: prefill.workflow ?? toolKind,
        entry_source: prefill.source,
        intent: prefill.intent,
        monetization_tier: mp.monetization_tier,
        generation_index: nextGenerationCount,
        lifetime_generation_count: lifetimeAfterSuccess,
        value_delivered: res.packages.length > 0,
        retrieval_used: retrievalUsed,
        revenue_summary: revenueSummary
      });
      logAssetSeoIntentEscalation({
        event: "intent_state_detected",
        current_intent_state: intentPlan.current_intent_state,
        next_intent_state: intentPlan.next_intent_state,
        recommended_nudge: intentPlan.recommended_nudge,
        escalation_strength: intentPlan.escalation_strength,
        topic_key: prefill.topic ?? effectiveForApi,
        workflow_id: prefill.workflow ?? toolKind,
        reason: "tool_runtime_v163"
      });
      if (intentPlan.current_intent_state !== intentPlan.next_intent_state && intentPlan.escalation_strength > 0) {
        logAssetSeoIntentEscalation({
          event: "intent_escalation_applied",
          current_intent_state: intentPlan.current_intent_state,
          next_intent_state: intentPlan.next_intent_state,
          recommended_nudge: intentPlan.recommended_nudge,
          escalation_strength: intentPlan.escalation_strength,
          topic_key: prefill.topic ?? effectiveForApi,
          reason: "tool_runtime_v163"
        });
      }
      if (
        intentPlan.next_intent_state === "high_intent_tool_entry" ||
        intentPlan.next_intent_state === "repeat_user_monetization"
      ) {
        logAssetSeoIntentEscalation({
          event: "high_intent_escalated",
          next_intent_state: intentPlan.next_intent_state,
          topic_key: prefill.topic ?? effectiveForApi,
          reason: "tool_runtime_v163"
        });
      }
      if (
        intentPlan.current_intent_state === "generation_ready" ||
        intentPlan.current_intent_state === "repeat_user_monetization"
      ) {
        logAssetSeoIntentEscalation({
          event: "monetization_ready_detected",
          current_intent_state: intentPlan.current_intent_state,
          topic_key: prefill.topic ?? effectiveForApi,
          reason: "tool_runtime_v163"
        });
      }
      const trigger = deriveMonetizationTrigger({
        monetization_tier: mp.monetization_tier,
        generation_count: nextGenerationCount,
        value_delivered: res.packages.length > 0,
        best_trigger_timing: bestTiming,
        strategy: {
          best_trigger_timing: monetizationStrategy.best_trigger_timing
        },
        escalation: {
          timing_offset: escalationTimingOffset(intentPlan, nextGenerationCount, nextGenerationCount <= 1),
          preferred_trigger_type: escalationPreferredTriggerType(intentPlan)
        }
      });
      const lastShownTs = Number(localStorage.getItem("te_monetization_trigger_last_shown_ts") || "0");
      const canShow = Date.now() - lastShownTs > 1000 * 60 * 60 * 12; // 12h cap
      if (trigger.trigger_type !== "none" && canShow) {
        const runtimeSeg = buildRuntimeSegmentStrategy({
          lane,
          topic: prefill.topic ?? effectiveForApi,
          workflow_id: prefill.workflow ?? toolKind,
          page_type: "tool",
          entry_source: prefill.source,
          intent: prefill.intent,
          monetization_tier: mp.monetization_tier,
          generation_index: nextGenerationCount,
          lifetime_generation_count: lifetimeAfterSuccess,
          retrieval_used: retrievalUsed,
          revenue_summary: revenueSummary
        });
        let triggerType: "soft" | "hard" = trigger.trigger_type === "hard" ? "hard" : "soft";
        triggerType = applyRuntimeMonetizationTriggerBias(triggerType, runtimeSeg, {
          monetization_tier: mp.monetization_tier,
          generation_index: nextGenerationCount
        });
        const strategy = monetizationStrategy;
        const sessionKeyBase = `te_monetization_variant_${triggerType}`;
        const persistedVariantId = localStorage.getItem(sessionKeyBase) || "";
        const winnerVariantId = localStorage.getItem(`te_monetization_winner_variant_${triggerType}`) || "";
        const rev = selectCtaVariantWithRevenueContext({
          topicKey: prefill.topic ?? effectiveForApi,
          workflowId: prefill.workflow ?? toolKind,
          baseTriggerType: triggerType,
          revenueSummary,
          seed: `${toolSlug}-${Date.now().toString(36)}-${prefill.topic ?? ""}`,
          segmentStrategy: {
            segment_key: runtimeSeg.segment_key,
            recommended_cta_style: runtimeSeg.recommended_cta_style,
            monetization_role: runtimeSeg.monetization_role
          },
          intentEscalation: {
            recommended_nudge: intentPlan.recommended_nudge,
            escalation_strength: intentPlan.escalation_strength
          },
          generationIndex: nextGenerationCount
        });
        const pool = variantsForTrigger(rev.trigger_type);
        const picked =
          pool.find((v) => v.id === strategy.variant_id) ??
          pool.find((v) => v.id === rev.variant.id) ??
          pool.find((v) => v.id === winnerVariantId) ??
          pool.find((v) => v.id === persistedVariantId) ??
          rev.variant ??
          pickVariantDeterministic(`${toolSlug}-${Date.now().toString(36)}-${prefill.topic ?? ""}`, rev.trigger_type);
        const sessionKey = `te_monetization_variant_${rev.trigger_type}`;
        localStorage.setItem(sessionKey, picked.id);
        const mergedTrigger: MonetizationTrigger = {
          ...trigger,
          trigger_type: rev.trigger_type
        };
        setMonetizationTrigger(mergedTrigger);
        setMonetizationVariant(picked);

        const amp = computeConversionPathAmplification({
          workflow_id: prefill.workflow ?? toolKind,
          normalized_topic: prefill.topic ?? effectiveForApi,
          page_type: "tool",
          revenueSummary,
          riskContext: null,
          segmentStrategy: {
            segment_key: runtimeSeg.segment_key,
            recommended_allocation_weight: runtimeSeg.recommended_allocation_weight,
            recommended_page_bias: runtimeSeg.recommended_page_bias
          },
          intentEscalation: {
            recommended_nudge: intentPlan.recommended_nudge,
            escalation_strength: intentPlan.escalation_strength
          }
        });
        logConversionPathRevenueAmplification({
          workflow_id: prefill.workflow ?? toolKind,
          normalized_topic: prefill.topic ?? effectiveForApi,
          page_type: "tool",
          amp,
          revenue_tier: rev.revenue_tier
        });
        logAssetSeoConversionFeedback({
          event: "cta_variant_selected",
          normalized_topic: prefill.topic ?? effectiveForApi,
          workflow_id: prefill.workflow ?? toolKind,
          page_type: mergedTrigger.trigger_position,
          cta_variant: picked.id,
          conversion_tier: rev.revenue_tier === "high" ? "high" : rev.revenue_tier === "low" ? "low" : "medium"
        });
        localStorage.setItem("te_monetization_trigger_last_shown_ts", String(Date.now()));
        trackEvent("monetization_trigger_fired", {
          tool_slug: toolMeta?.slug ?? toolSlug,
          topic_slug: prefill.topic ?? effectiveForApi,
          prompt_id: prefill.workflow ?? "",
          page_type: mergedTrigger.trigger_type
        } as any);
        trackEvent("monetization_variant_assigned", {
          tool_slug: toolMeta?.slug ?? toolSlug,
          variant_id: picked.id,
          page_type: mergedTrigger.trigger_type
        } as any);
        if (strategy.source !== "fallback") {
          trackEvent("monetization_global_winner_applied", {
            tool_slug: toolMeta?.slug ?? toolSlug,
            variant_id: strategy.variant_id,
            page_type: strategy.source
          } as any);
          trackEvent("monetization_server_timing_applied", {
            tool_slug: toolMeta?.slug ?? toolSlug,
            page_type: String(strategy.best_trigger_timing)
          } as any);
          if (strategy.source === "topic") {
            trackEvent("monetization_topic_strategy_applied", {
              tool_slug: toolMeta?.slug ?? toolSlug,
              topic_slug: prefill.topic ?? effectiveForApi
            } as any);
          } else if (strategy.source === "workflow") {
            trackEvent("monetization_workflow_strategy_applied", {
              tool_slug: toolMeta?.slug ?? toolSlug,
              prompt_id: prefill.workflow ?? toolKind
            } as any);
          }
        }
        bumpVariantStat(picked.id, "shown");
        trackUpgradeShown({
          tool_slug: toolMeta?.slug ?? toolSlug,
          topic: prefill.topic ?? effectiveForApi,
          workflow: prefill.workflow ?? "",
          trigger_type: mergedTrigger.trigger_type,
          variant_id: picked.id
        });
      } else {
        setMonetizationTrigger(null);
        setMonetizationVariant(null);
      }
    } catch (err) {
      if (err instanceof LimitReachedError || err instanceof CreditsDepletedError) {
        setLimitModalOpen(true);
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        setGenerateError(msg || "Generation failed");
      }
    } finally {
      setIsGenerating(false);
    }
  }

  const isDouyinTool = toolSlug.startsWith("douyin-");
  /** V106.2 — absolute URL for share blocks + ?q= theme */
  const toolShareUrl = useMemo(() => {
    const base = BASE_URL.replace(/\/$/, "");
    const path = pathname || "";
    const trimmed = idea.trim();
    if (!trimmed) return `${base}${path}`;
    return `${base}${path}?${seedFromQueryParam}=${encodeURIComponent(trimmed)}`;
  }, [pathname, idea, seedFromQueryParam]);
  const enJourney = !zhSite ? getEnToolJourney(toolSlug) : null;
  const shellIntroProblem = introProblemProp ?? enJourney?.introProblem;
  const shellIntroAudience = introAudienceProp !== undefined ? introAudienceProp : enJourney?.introAudience;
  let generateLabelEffective =
    zhSite && publishFullPack ? "一键生成完整内容" : enJourney?.generateCta ?? generateButtonLabel;

  // V191.1 — bind generation CTA to primary issues for hook-generator.
  if (!zhSite && creatorKnowledgeEngine && toolKind === "hook_focus") {
    generateLabelEffective = primaryIssueTitle ? `Fix your ${primaryIssueTitle}` : "Generate hooks";
  }

  const showDouyinMobileSticky = zhSite && isDouyinTool && idea.trim().length > 0 && !isGenerating;

  useEffect(() => {
    if (!zhSite || !toolMeta) return;

    if (isDouyinTool) {
      trackEvent("douyin_tool_view", {
        tool_slug: toolMeta.slug,
        tool_category: toolMeta.category,
        country
      });
      trackConversion("douyin_tool_view", {
        tool_slug: toolMeta.slug,
        tool_category: toolMeta.category,
        market: "cn",
        locale
      });
    } else {
      trackConversion("cn_tool_view", {
        tool_slug: toolMeta.slug,
        tool_category: toolMeta.category,
        market: "cn",
        locale
      });
    }
  }, [zhSite, isDouyinTool, toolMeta, country, locale]);

  return (
    <>
      <LimitReachedModal
        open={limitModalOpen}
        onClose={() => setLimitModalOpen(false)}
        variant="quality"
        locale={zhSite ? "zh_cn" : "en"}
      />
      {zhSite && isDouyinTool ? (
        <ZhDouyinCreditsBar
          authenticated={authenticated}
          billing={cnBilling}
          usageRemaining={usageRemaining}
          creditsRemaining={cnCreditsRemaining}
          creditsDaysLeft={cnCreditsDaysLeft}
          publishFullPack={publishFullPack}
          loginNextPath={pathname || "/zh"}
        />
      ) : null}
      <div className={showDouyinMobileSticky ? "pb-[5.5rem] md:pb-0" : undefined}>
      <ToolPageShell
        eyebrow={eyebrow}
        title={title}
        description={description}
        introProblem={shellIntroProblem}
        introAudience={shellIntroAudience}
        toolSlug={toolSlug}
        toolName={title}
        siteMode={siteMode}
        locale={locale}
        input={
          <ToolInputCard label={inputLabel}>
            <TikTokChainProgressHint toolSlug={toolSlug} />
            {!isDouyinTool && zhSite && cnBilling === "credits" && cnCreditsRemaining !== null && cnCreditsRemaining > 0 ? (
              <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-950">
                <span className="font-semibold">
                  剩余 {cnCreditsRemaining} 次
                  {cnCreditsDaysLeft !== null ? `（有效期 ${cnCreditsDaysLeft} 天）` : ""}
                </span>
                <p className="mt-1 text-[11px] text-emerald-900/80">
                  完整内容包每次消耗更多次数；可在上方取消勾选以节省次数。
                </p>
              </div>
            ) : null}
            {!isDouyinTool && zhSite && cnBilling === "legacy_pro" ? (
              <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                当前为 Pro 权益（或已迁移算力包）；生成按次数计费时以剩余次数为准。
              </div>
            ) : null}
            {!isDouyinTool &&
            usageRemaining !== null &&
            !(zhSite && cnBilling === "credits" && (cnCreditsRemaining ?? 0) > 0) ? (
              <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <span className="font-semibold text-slate-800">
                  {zhSite ? "今日剩余：" : "Today's remaining: "}
                  <span className={usageRemaining <= 1 ? "text-rose-700 font-bold" : "text-slate-900"}>
                    {usageRemaining}
                  </span>
                  {zhSite ? "次" : " runs"}
                </span>
                {usageRemaining <= 1 && usageRemaining >= 0 && (
                  null
                )}
              </div>
            ) : null}
            {zhSite ? (
              <label className="flex items-center gap-2 text-xs text-slate-700 mb-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  checked={publishFullPack}
                  onChange={(e) => setPublishFullPack(e.target.checked)}
                />
                <span>一键完整内容包（选题 + 全文口播 + 描述区 + 评论引导）</span>
              </label>
            ) : null}
            {creatorKnowledgeEngine && !zhSite ? <CreatorScoreCard toolSlug={toolSlug} locale={locale} /> : null}
            {creatorKnowledgeEngine && !zhSite ? <CreatorMonetizationCard toolSlug={toolSlug} locale={locale} /> : null}
            {creatorKnowledgeEngine && !zhSite && toolKind === "hook_focus" ? (
              hasCreatorAnalysis && creatorAnalysisOutput ? (
                <CreatorAnalysisInsightCard output={creatorAnalysisOutput} />
              ) : (
                <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">
                    Run your first content analysis to unlock smarter generation
                  </p>
                  <DelegatedButton
                    onClick={() => router.push("/creator-analysis")}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                  >
                    Run analysis <span className="text-slate-400">→</span>
                  </DelegatedButton>
                </div>
              )
            ) : null}
            {creatorKnowledgeEngine && !zhSite ? (
              <CreatorTakeoverGuidance
                toolSlug={toolSlug}
                intentId={keIntent}
                scenarioId={keScenario}
                topicHint={idea.trim()}
                locale={locale}
                onPrimaryGenerate={() => void runGenerate()}
                isGenerating={isGenerating}
                primaryLabelOverride={hookFixPrimaryLabelOverride}
              />
            ) : null}
            {creatorKnowledgeEngine && !zhSite ? (
              <CreatorKnowledgeEnginePanel
                toolSlug={toolSlug}
                intentId={keIntent}
                scenarioId={keScenario}
                onIntentChange={setKeIntent}
                onScenarioChange={setKeScenario}
                locale={locale}
              />
            ) : null}
            <DelegatedButton
              onClick={() => setIdea(tryExample)}
              className="text-xs font-medium text-sky-700 hover:underline mb-2 block"
            >
              {zhSite ? "填入示例主题" : "Try example"}
            </DelegatedButton>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              maxLength={MAX_INPUT_LENGTH + 50}
              className="w-full min-h-[110px] resize-none rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner shadow-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-400/80"
              placeholder={placeholder}
            />
            {idea.length > MAX_INPUT_LENGTH && (
              <p className="text-xs text-amber-600 mt-1">
                {zhSite
                  ? `请控制在 ${MAX_INPUT_LENGTH} 字以内。`
                  : `Please keep under ${MAX_INPUT_LENGTH} characters.`}
              </p>
            )}
            {generateError ? (
              <p className="text-sm text-rose-600 mt-2" role="alert">
                {generateError}
              </p>
            ) : null}

            {outputPreview ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-900">Preview (ready-to-paste blocks)</p>
                <div className="mt-2 text-xs text-slate-700 leading-snug">{outputPreview}</div>
              </div>
            ) : null}

            <DelegatedButton
              onClick={runGenerate}
              disabled={isGenerating}
              className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-75 transition duration-150 ${
                isDouyinTool ? "min-h-[3.25rem] text-base" : ""
              }`}
            >
              {isGenerating ? (
                <>
                  <span className="inline-block h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  {zhSite ? "正在生成完整文案包…" : "Generating packages…"}
                </>
              ) : (
                <>
                  {generateLabelEffective}
                  <span className="text-slate-400">→</span>
                </>
              )}
            </DelegatedButton>
          </ToolInputCard>
        }
        result={
          <>
            {creatorKnowledgeEngine && !zhSite && packages.length > 0 ? (
              <>
                <CreatorScoreCard toolSlug={toolSlug} variant="compact" locale={locale} />
                <CreatorMonetizationCard toolSlug={toolSlug} variant="compact" locale={locale} />
                <WorkflowNextStepCard
                  toolSlug={toolSlug}
                  hasResults={packages.length > 0}
                  intentId={keIntent}
                  scenarioId={keScenario}
                  topicHint={idea.trim()}
                  locale={locale}
                />
                <V186ContextStrip toolSlug={toolSlug} intentId={keIntent} scenarioId={keScenario} locale={locale} />
              </>
            ) : null}
            <div ref={resultsAnchorRef}>
              <PostPackageResults
                title={resultTitle}
                packages={packages}
                lockedPreview={lockedPreview}
                isLoading={isGenerating}
                emptyMessage={emptyMessage}
                toolSlug={toolSlug}
                contentId={contentId ?? undefined}
                tierApplied={tierApplied}
                resultQuality={resultQuality}
                onRegenerate={runGenerate}
                userInput={idea}
                lifetimeGenerationCount={lifetimeGenCount}
                usageRemaining={usageRemaining}
                uiLocale={zhSite ? "zh" : "en"}
                upgradeMode={zhSite ? "china" : "global"}
                supportSourcePath={pathname || undefined}
                contentSafety={contentSafety}
                douyinConversionMode={zhSite && isDouyinTool}
                packageLabelsZh={packageLabelsZh}
                shareQueryParam={seedFromQueryParam}
                publishReadyNotice={zhSite && publishFullPackEcho}
                toolShareUrl={toolShareUrl}
                v188ReadyToPost={Boolean(!zhSite && creatorKnowledgeEngine)}
                analysisAppliedHint={analysisAppliedHint}
                monetizationUsageHint={monetizationUsageHint}
                v193PlatformHint={v193ResultHint}
                v193ChainBadge={v193ChainBadge}
              />
            </div>
            {!zhSite ? (
              <ToolNextSteps
                toolSlug={toolSlug}
                hasOutput={packages.length > 0 || (lockedPreview?.length ?? 0) > 0}
              />
            ) : null}
          </>
        }
        howItWorks={
          <HowItWorksCard
            steps={howItWorksSteps}
            title={zhSite ? "怎么用" : "How it works"}
          />
        }
        proTips={<ToolProTipsCard tips={proTips} title={zhSite ? "进阶技巧" : "Pro tips"} />}
        extraSections={[
          {
            title: zhSite ? "结构化输入示例" : "Structured input examples",
            content: (
              <StructuredExamplesLibrary
                category={examplesCategory}
                onPickExample={setIdea}
                locale={zhSite ? "zh" : "en"}
              />
            )
          },
          {
            title: zhSite ? "历史生成记录" : "Generation history",
            content: <HistoryPanel toolSlug={toolSlug} refreshTrigger={historyTrigger} />
          },
          {
            title: zhSite ? "结果价值说明" : "Output value notes",
            content: <ValueProofBlock variant={valueProofVariant} locale={zhSite ? "zh" : "en"} />
          },
          ...(ctaLinks && ctaLinks.length > 0
            ? [
                {
                  title: zhSite ? "相关学习链接" : "Related learning links",
                  content: <CtaLinksSection links={ctaLinks} variant={zhSite ? "zh" : "default"} />
                }
              ]
            : []),
          ...(relatedAside
            ? [
                {
                  title: zhSite ? "相关工具与资源" : "Related tools and resources",
                  content: relatedAside
                }
              ]
            : [])
        ]}
      />
      </div>
      {showDouyinMobileSticky ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-700/80 bg-slate-950/95 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_28px_rgba(0,0,0,0.35)] md:hidden">
          <DelegatedButton
            onClick={runGenerate}
            disabled={isGenerating}
            className="inline-flex w-full min-h-[3.25rem] items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-base font-bold text-white shadow-md hover:bg-red-500 disabled:opacity-70"
          >
            {isGenerating ? (
              <>
                <span className="inline-block h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                生成中…
              </>
            ) : (
              <>
                {generateLabelEffective}
                <span className="text-red-100">→</span>
              </>
            )}
          </DelegatedButton>
        </div>
      ) : null}
      {monetizationTrigger && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-semibold">{monetizationVariant?.text ?? monetizationTrigger.trigger_message}</p>
          <div className="mt-2">
            <a
              href={siteMode === "china" ? "/zh/pricing" : "/pricing"}
              onClick={() => {
                if (toolMeta) {
                  trackUpgradeClicked({
                    tool_slug: toolMeta.slug,
                    topic: prefill.topic ?? idea,
                    workflow: prefill.workflow ?? "",
                    trigger_type: monetizationTrigger.trigger_type,
                    variant_id: monetizationVariant?.id
                  });
                  if (monetizationVariant?.id) {
                    bumpVariantStat(monetizationVariant.id, "clicked");
                    const winner = computeWinnerVariant(monetizationVariant.trigger_type);
                    if (winner) {
                      trackEvent("monetization_variant_winner_selected", {
                        tool_slug: toolMeta.slug,
                        variant_id: winner,
                        page_type: monetizationVariant.trigger_type
                      } as any);
                    }
                  }
                }
                trackEvent("upgrade_clicked", {
                  tool_slug: toolMeta?.slug ?? toolSlug,
                  topic_slug: prefill.topic ?? idea,
                  prompt_id: prefill.workflow ?? "",
                  variant_id: monetizationVariant?.id ?? ""
                } as any);
              }}
              className="inline-flex items-center rounded-lg bg-amber-600 px-3 py-1.5 font-semibold text-white hover:bg-amber-500"
            >
              Upgrade for full power
            </a>
          </div>
        </div>
      )}
    </>
  );
}
