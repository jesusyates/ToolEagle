"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
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
import { ExitIntentCta } from "@/components/tools/ExitIntentCta";
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

const LIFETIME_GEN_KEY = "te_v96_lifetime_pkg_gens";

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
  packageLabelsZh
}: PostPackageToolClientProps) {
  const intlLocale = useLocale();
  const locale = siteMode === "china" ? "zh" : intlLocale;
  const country = useCountry();
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();
  const q = searchParams.get(seedFromQueryParam) ?? "";
  const [idea, setIdea] = useState(q);
  const [packages, setPackages] = useState<CreatorPostPackage[]>([]);
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

  const toolMeta = tools.find((t) => t.slug === toolSlug);

  useEffect(() => {
    const n = parseInt(
      typeof window !== "undefined" ? localStorage.getItem(LIFETIME_GEN_KEY) || "0" : "0",
      10
    );
    setLifetimeGenCount(n);
  }, []);

  function applyUsageStatusPayload(d: Record<string, unknown>) {
    const bm = d.billingModel;
    setCnBilling(
      bm === "credits" ? "credits" : bm === "legacy_pro" ? "legacy_pro" : bm === "free" ? "free" : null
    );
    if (typeof d.creditsRemaining === "number") setCnCreditsRemaining(d.creditsRemaining);
    setCnCreditsDaysLeft(typeof d.creditsDaysLeft === "number" ? d.creditsDaysLeft : null);
    if (typeof d.remaining === "number") setUsageRemaining(d.remaining);
    if (typeof d.authenticated === "boolean") setAuthenticated(d.authenticated);
  }

  useEffect(() => {
    fetch("/api/usage-status")
      .then((r) => r.json())
      .then((d) => applyUsageStatusPayload(d as Record<string, unknown>))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!toolMeta) return;
    trackEvent("tool_page_view", { tool_slug: toolMeta.slug, tool_category: toolMeta.category, country });
  }, [toolMeta, country]);

  async function runGenerate() {
    const trimmed = idea.trim();
    if (!trimmed) {
      setPackages([]);
      setLockedPreview([]);
      setContentSafety(null);
      setPublishFullPackEcho(false);
      return;
    }
    if (trimmed.length > MAX_INPUT_LENGTH) {
      setPackages([]);
      setLockedPreview([]);
      setContentSafety(null);
      setPublishFullPackEcho(false);
      return;
    }

    setIsGenerating(true);
    try {
      const res = await generatePostPackages(trimmed, toolKind, {
        locale,
        market: siteMode === "china" ? "cn" : undefined,
        clientRoute: pathname || undefined,
        publishFullPack: siteMode === "china" ? publishFullPack : false
      });
      setPackages(res.packages);
      setLockedPreview(res.lockedPreview ?? []);
      setTierApplied(res.tierApplied);
      setResultQuality(res.resultQuality);
      setContentSafety(res.contentSafety ?? null);
      setPublishFullPackEcho(res.publishFullPack === true);
      if (toolMeta) {
        trackEvent("tool_generate_ai", {
          tool_slug: toolMeta.slug,
          tool_category: toolMeta.category,
          input_length: trimmed.length,
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
          input: trimmed,
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
      }
    } catch (err) {
      if (err instanceof LimitReachedError || err instanceof CreditsDepletedError) {
        setLimitModalOpen(true);
      }
    } finally {
      setIsGenerating(false);
    }
  }

  const zhSite = siteMode === "china";
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
  const generateLabelEffective =
    zhSite && publishFullPack ? "一键生成完整内容" : enJourney?.generateCta ?? generateButtonLabel;

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
      {packages.length > 0 && (
        <ExitIntentCta toolSlug={toolSlug} toolName={title} siteMode={siteMode} />
      )}
      <div className={showDouyinMobileSticky ? "pb-[5.5rem] md:pb-0" : undefined}>
      <ToolPageShell
        eyebrow={eyebrow}
        title={title}
        description={description}
        introProblem={enJourney?.introProblem}
        introAudience={enJourney?.introAudience}
        toolSlug={toolSlug}
        toolName={title}
        siteMode={siteMode}
        input={
          <ToolInputCard label={inputLabel}>
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
                  <p className="mt-1 text-xs text-rose-700 font-medium">
                    {zhSite ? "免费次数即将用完" : "Almost out of free runs"}
                  </p>
                )}
                {usageRemaining === 0 && (
                  <p className="mt-1 text-xs text-rose-800 font-bold">
                    {zhSite ? "已达今日上限 — 升级可继续" : "Limit reached — upgrade to continue"}
                  </p>
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
            <PostPackageResults
              title={resultTitle}
              packages={packages}
              lockedPreview={lockedPreview}
              isLoading={isGenerating}
              emptyMessage={emptyMessage}
              toolSlug={toolSlug}
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
            />
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
        aside={
          <>
            <ValueProofBlock variant={valueProofVariant} locale={zhSite ? "zh" : "en"} />
            <StructuredExamplesLibrary
              category={examplesCategory}
              onPickExample={setIdea}
              locale={zhSite ? "zh" : "en"}
            />
            <HistoryPanel toolSlug={toolSlug} refreshTrigger={historyTrigger} />
            <ToolProTipsCard tips={proTips} title={zhSite ? "进阶技巧" : "Pro tips"} />
            {ctaLinks && ctaLinks.length > 0 ? (
              <CtaLinksSection links={ctaLinks} variant={zhSite ? "zh" : "default"} />
            ) : null}
            {relatedAside}
          </>
        }
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
    </>
  );
}
