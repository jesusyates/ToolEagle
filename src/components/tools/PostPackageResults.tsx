"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Copy, RefreshCw, BookmarkPlus, Target, Lock, Share2 } from "lucide-react";
import { safeCopyToClipboard } from "@/lib/clipboard";
import type { CreatorPostPackage } from "@/lib/ai/postPackage";
import {
  PACKAGE_SECTION_LABELS,
  POST_PACKAGE_KEYS,
  V106_PACKAGE_KEYS,
  formatPackageAsPlainText
} from "@/lib/ai/postPackage";
import type { LockedPackagePreview } from "@/lib/ai/packageTierSplit";
import { savePackageAsTemplate } from "@/lib/templates/localTemplates";
import { DelegatedButton } from "@/components/DelegatedButton";
import Link from "next/link";
import { FeedbackLauncher } from "@/components/feedback/FeedbackLauncher";
import { SupportModal } from "@/components/monetization/SupportModal";
import { SupportPrompt } from "@/components/monetization/SupportPrompt";
import { trackEvent } from "@/lib/analytics";
import { trackConversion } from "@/lib/analytics/conversionClient";
import { getSupportClientAnalyticsId } from "@/lib/supporter/client-analytics-id";
import {
  markMilestoneSeen,
  parseSeenMilestones,
  shouldShowSupportPromptAtCount
} from "@/lib/supporter/support-prompt-rules";
import { PACKAGE_SECTION_LABELS_ZH } from "@/lib/zh-site/packageLabels";
import { DOUYIN_RESULT_LABELS, douyinFieldRoleTag } from "@/lib/zh-site/douyin-result-labels";
import { ZhDouyinWorkflowNextStep } from "@/components/zh/ZhDouyinWorkflowNextStep";
import type { ContentSafetyClientMeta } from "@/lib/ai/generatePostPackage";
import { BASE_URL } from "@/config/site";
import { ZH } from "@/lib/zh-site/paths";
import {
  V1062AggregatedTrafficBlocks,
  V1062PerPackageShareBlock
} from "@/components/zh/V1062ExternalTrafficResultBlocks";
import { logOutputCopy, mapPackageFieldKeyToResultType } from "@/lib/tool-output-quality";

type Props = {
  title: string;
  packages: CreatorPostPackage[];
  lockedPreview?: LockedPackagePreview[];
  isLoading?: boolean;
  emptyMessage: string;
  toolSlug: string;
  tierApplied: "free" | "pro";
  resultQuality: "compact_post_package" | "full_post_package";
  onRegenerate: () => void;
  userInput: string;
  /** V96: total successful package generations this browser (after current) */
  lifetimeGenerationCount: number;
  /** V96: from /api/usage-status */
  usageRemaining: number | null;
  /** V97.1 — localized chrome + /zh/pricing upgrade path */
  uiLocale?: "en" | "zh";
  upgradeMode?: "global" | "china";
  /** V100.2 — path for support analytics + ledger source_page */
  supportSourcePath?: string;
  /** V104 — echo from API; trust line still shows when absent */
  contentSafety?: ContentSafetyClientMeta | null;
  /** V104.2 — Douyin stack: stronger tags, upgrade analytics, richer locked previews */
  douyinConversionMode?: boolean;
  /** V105.1 — merge over default zh labels */
  packageLabelsZh?: Partial<Record<keyof CreatorPostPackage, string>>;
  /** V105.2 — query param for share URL (must match tool seed param, usually q) */
  shareQueryParam?: string;
  /** V106.1 — show time-saving line after successful full-pack generation */
  publishReadyNotice?: boolean;
  /** V106.2 — absolute tool URL for share blocks (incl. ?q= when set) */
  toolShareUrl?: string;
};

export function PostPackageResults({
  title,
  packages,
  lockedPreview = [],
  isLoading = false,
  emptyMessage,
  toolSlug,
  tierApplied,
  resultQuality,
  onRegenerate,
  userInput,
  lifetimeGenerationCount,
  usageRemaining,
  uiLocale = "en",
  upgradeMode = "global",
  supportSourcePath,
  contentSafety,
  douyinConversionMode = false,
  packageLabelsZh,
  shareQueryParam = "q",
  publishReadyNotice = false,
  toolShareUrl
}: Props) {
  const pathname = usePathname() || "";
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [hasRecordedSupport, setHasRecordedSupport] = useState(false);
  const [, bumpSeen] = useReducer((x: number) => x + 1, 0);
  const viewTracked = useRef<number | null>(null);
  const douyinLockedTracked = useRef(false);
  const zh = uiLocale === "zh";
  const douyinHubAbsolute = `${BASE_URL.replace(/\/$/, "")}${ZH.douyinHub}`;
  const showV1062Blocks =
    zh && upgradeMode === "china" && typeof toolShareUrl === "string" && toolShareUrl.length > 0;
  const labels: Partial<Record<keyof CreatorPostPackage, string>> = zh
    ? {
        ...PACKAGE_SECTION_LABELS_ZH,
        ...packageLabelsZh,
        ...(douyinConversionMode ? DOUYIN_RESULT_LABELS : {})
      }
    : PACKAGE_SECTION_LABELS;
  const isFree = tierApplied === "free";
  const showRechargeEntry = isFree && usageRemaining === 0;

  /** V103.1 — Rule-based value tag per result · V104.2 — Douyin publish-ready tags */
  const VALUE_TAGS_ZH = ["🔥 适合带货", "📈 提升完播率", "💬 强互动结构", "🎯 转化型开头"] as const;
  const DOUYIN_TAGS_ZH = [
    "带货",
    "干货",
    "情绪共鸣",
    "个人IP",
    "引发评论",
    "完播导向",
    "知识口播",
    "娱乐节奏"
  ] as const;
  const VALUE_TAGS_EN = ["🔥 Product/selling", "📈 High completion", "💬 Strong CTA", "🎯 Convert-focused"] as const;
  function getValueTag(idx: number): string {
    if (zh && douyinConversionMode) {
      return DOUYIN_TAGS_ZH[idx % DOUYIN_TAGS_ZH.length];
    }
    const arr = zh ? VALUE_TAGS_ZH : VALUE_TAGS_EN;
    return arr[idx % arr.length];
  }

  const showContent = !isLoading && packages.length > 0;
  const supportRoute = supportSourcePath || "/zh";
  const seenMilestones = parseSeenMilestones();
  const activeSupportMilestone =
    zh && showContent
      ? shouldShowSupportPromptAtCount(
          lifetimeGenerationCount,
          hasRecordedSupport,
          seenMilestones
        )
      : null;

  useEffect(() => {
    if (!zh || !showContent) return;
    fetch("/api/donation/history", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const n = typeof d?.stats?.count === "number" ? d.stats.count : 0;
        if (n > 0) {
          setHasRecordedSupport(true);
          try {
            localStorage.setItem("te_support_user_has_recorded", "1");
          } catch {
            /* ignore */
          }
        } else {
          try {
            if (localStorage.getItem("te_support_user_has_recorded") === "1") {
              setHasRecordedSupport(true);
            }
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {});
  }, [zh, showContent, packages.length, supportModalOpen, bumpSeen]);

  useEffect(() => {
    if (activeSupportMilestone == null) return;
    if (viewTracked.current === activeSupportMilestone) return;
    viewTracked.current = activeSupportMilestone;
    trackEvent("support_prompt_view", {
      route: supportRoute,
      market: "cn",
      locale: "zh",
      source_page: supportRoute,
      supporter_id: getSupportClientAnalyticsId(),
      milestone: activeSupportMilestone
    });
  }, [activeSupportMilestone, supportRoute]);

  function handleSupportMarkSeen() {
    if (activeSupportMilestone != null) {
      markMilestoneSeen(activeSupportMilestone);
    }
    bumpSeen();
  }

  const showLocked = isFree && lockedPreview.length > 0;
  const cnHardPaywallUi = zh && isFree && upgradeMode === "china";
  const nearLimit = showRechargeEntry;
  const secondUseHighlight = false;

  useEffect(() => {
    douyinLockedTracked.current = false;
  }, [userInput]);

  useEffect(() => {
    if (!douyinConversionMode || !showLocked || douyinLockedTracked.current) return;
    douyinLockedTracked.current = true;
    trackEvent("douyin_locked_content_view", {
      tool_slug: toolSlug,
      locked_count: lockedPreview.length
    });

    trackConversion("douyin_locked_content_view", {
      tool_slug: toolSlug,
      market: "cn",
      locale: "zh",
      locked_count: lockedPreview.length
    });
  }, [douyinConversionMode, showLocked, lockedPreview.length, toolSlug, userInput]);

  useEffect(() => {
    if (!zh || upgradeMode !== "china") return;
    if (douyinConversionMode) return;
    if (!showLocked) return;
    if (douyinLockedTracked.current) return; // reuse same one-shot guard
    douyinLockedTracked.current = true;
    trackConversion("cn_locked_content_view", {
      tool_slug: toolSlug,
      market: "cn",
      locale: "zh",
      locked_count: lockedPreview.length
    });
  }, [zh, upgradeMode, douyinConversionMode, showLocked, lockedPreview.length, toolSlug, userInput]);

  async function copyAll(pkg: CreatorPostPackage) {
    await safeCopyToClipboard(formatPackageAsPlainText(pkg, labels));
    logOutputCopy(toolSlug, "full");
  }

  async function copyField(key: keyof CreatorPostPackage, pkg: CreatorPostPackage) {
    const v = (pkg[key] ?? "").toString();
    if (v.trim()) {
      await safeCopyToClipboard(v);
      logOutputCopy(toolSlug, mapPackageFieldKeyToResultType(String(key)));
    }
  }

  async function copyShareablePageLink() {
    if (typeof window === "undefined") return;
    const u = new URL(`${window.location.origin}${pathname}`);
    const q = userInput.trim();
    if (q) u.searchParams.set(shareQueryParam, q);
    await safeCopyToClipboard(u.toString());
    trackEvent("tool_share_link_copy", { tool_slug: toolSlug, path: pathname });
    if (upgradeMode === "china") {
      trackConversion("tool_share_link_copy", {
        tool_slug: toolSlug,
        path: pathname,
        market: "cn",
        locale: "zh"
      });
    }
    setSavedToast(zh ? "已复制分享链接（含你的输入主题）" : "Share link copied (includes your topic)");
    setTimeout(() => setSavedToast(null), 2500);
  }

  function saveTemplate(pkg: CreatorPostPackage) {
    savePackageAsTemplate(toolSlug, pkg);
    setSavedToast(zh ? "已保存为本地模板" : "Saved as local template");
    setTimeout(() => setSavedToast(null), 2500);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {publishReadyNotice && zh && showContent ? (
            <p className="mt-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-lg px-2.5 py-1.5 inline-block">
              已为你生成完整内容结构 · 分段可复制
            </p>
          ) : null}
          {showContent && (
            <p className="mt-1.5 text-[11px] text-emerald-900/90 leading-snug flex items-start gap-1.5">
              <span className="shrink-0" aria-hidden>
                🛡️
              </span>
              <span>
                {zh
                  ? "已自动优化为更符合平台规范的表达方式。"
                  : "We’ve automatically tuned this copy for platform-appropriate wording—aligned with TikTok, YouTube Shorts, Reels, and similar norms. Assistive only; not legal advice or a guarantee of approval."}
                {contentSafety && contentSafety.filteredCount > 0 ? (
                  <span className="text-emerald-800/80">
                    {zh
                      ? ` 已处理 ${contentSafety.filteredCount} 处敏感表述。`
                      : ` Applied ${contentSafety.filteredCount} light wording adjustment${contentSafety.filteredCount === 1 ? "" : "s"} for safer phrasing.`}
                  </span>
                ) : null}
              </span>
            </p>
          )}
        </div>
        {showContent && (
          <DelegatedButton
            type="button"
            onClick={onRegenerate}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {zh ? "重新生成变体" : "Regenerate variants"}
          </DelegatedButton>
        )}
      </div>

      {nearLimit && (
        <div
          className={`px-4 py-3 border-b text-sm ${
            douyinConversionMode
              ? "bg-slate-50 border-slate-200 text-slate-800"
              : "bg-rose-50 border-rose-100 text-rose-950"
          }`}
        >
          {zh ? (
            douyinConversionMode ? (
              <>
                <span className="font-semibold">今日免费次数已用完。</span>
                继续生成请前往{" "}
                <Link href="/zh/pricing#cn-credits-checkout" className="text-red-800 font-semibold underline">
                  充值页面 →
                </Link>
              </>
            ) : (
              <>
                <span className="font-bold">今日免费次数已用完。</span>
                继续生成请前往{" "}
                <Link href="/zh/pricing#cn-credits-checkout" className="text-rose-800 font-bold underline">
                  充值页面 →
                </Link>
              </>
            )
          ) : (
            <>
              <span className="font-bold">You have used all free runs for today.</span> Continue generation at{" "}
              <Link href="/pricing" className="text-rose-800 font-bold underline">
                pricing →
              </Link>
            </>
          )}
        </div>
      )}

      {secondUseHighlight && (
        <div className="px-4 py-3 bg-violet-50 border-b border-violet-100 text-sm text-violet-950">
          {zh ? (
            <>
              <span className="font-bold">第二次生成，节奏对了。</span>
            </>
          ) : (
            <>
              <span className="font-bold">Second run — nice.</span>
            </>
          )}
        </div>
      )}

      {isFree && showContent && (
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 text-sm text-amber-950">
          {zh ? (
            cnHardPaywallUi ? (
              douyinConversionMode ? (
                <>
                  <span className="font-semibold">抖音免费档：</span>每次仅完整预览{" "}
                  <strong>1 套</strong>
                  部分结果（钩子/口播/正文已<strong>强截断</strong>）；另有{" "}
                  <strong>{lockedPreview.length} 套</strong> Pro 变体在下方，含<strong>更强钩子、完整五段口播、为什么能爆与转化拆解</strong>
                  （预览区可见真实口播截断，非空占位）。
                </>
              ) : (
              <>
                <span className="font-semibold">免费档：</span>每条仅展示{" "}
                <strong>{packages.length} 套部分结果</strong>（开头/口播/正文/话题等已截断），
                <strong>「为什么能爆」「转化拆解」「涨粉案例向策略」</strong>已锁定。
              </>
              )
            ) : (
              <>
                <span className="font-semibold">免费预览：</span>下方展示 {packages.length} 套可见区块 +{" "}
                <strong>{lockedPreview.length} 个 Pro 专属变体</strong>已模糊处理。
              </>
            )
          ) : (
            <>
              <span className="font-semibold">Free preview:</span> 3 full blocks below +{" "}
              <strong>{lockedPreview.length} full-package variants (locked)</strong> blurred.
            </>
          )}
        </div>
      )}

      {savedToast && (
        <div className="px-4 py-2 bg-emerald-50 text-xs text-emerald-800 border-b border-emerald-100">{savedToast}</div>
      )}

      <div className="p-4 space-y-6">
        {isLoading && (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-slate-100 rounded w-1/3" />
            <div className="h-24 bg-slate-50 rounded-xl" />
            <div className="h-24 bg-slate-50 rounded-xl" />
          </div>
        )}

        {!isLoading && packages.length === 0 && (
          <p className="text-sm text-slate-500">{emptyMessage}</p>
        )}

        {showContent &&
          packages.map((pkg, idx) => (
            <article
              key={idx}
              className="rounded-2xl border-2 border-slate-100 bg-slate-50/40 overflow-hidden"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-white border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wide text-sky-700 flex items-center gap-2 flex-wrap">
                  {zh ? `文案包 ${idx + 1}` : `Package ${idx + 1}`}
                  {isFree ? (zh ? " · 免费档" : " — Free") : ""}
                  <span className="text-[10px] font-normal normal-case text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    {getValueTag(idx)}
                  </span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => copyAll(pkg)}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-800"
                  >
                    <Copy className="h-3 w-3" />
                    {zh ? "复制结果" : "Copy all"}
                  </button>
                  {zh ? (
                    <button
                      type="button"
                      onClick={() => void copyShareablePageLink()}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-950 hover:bg-red-100"
                    >
                      <Share2 className="h-3 w-3" />
                      分享链接
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={onRegenerate}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <RefreshCw className="h-3 w-3" />
                    {zh ? "换新变体" : "New variants"}
                  </button>
                  <button
                    type="button"
                    onClick={() => saveTemplate(pkg)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <BookmarkPlus className="h-3 w-3" />
                    {zh ? "存为模板" : "Save template"}
                  </button>
                </div>
              </div>

              {!isFree && douyinConversionMode && zh ? (
                <p className="px-3 py-1.5 text-[11px] text-red-950 bg-gradient-to-r from-red-50/90 to-amber-50/40 border-b border-red-100/80">
                  <strong>发布向 Pro 包：</strong>含完整「三层为什么」、真实场景、普通/优化对照与可拍节奏；免费档为截断预览。
                </p>
              ) : null}

              <div className="p-3 space-y-3">
                {(pkg.variation_pack?.trim() || pkg.hook_strength_label?.trim()) && (
                  <div className="flex flex-wrap items-center gap-2">
                    {pkg.variation_pack?.trim() ? (
                      <span className="text-[10px] font-bold uppercase tracking-wide rounded-full bg-violet-100 text-violet-900 px-2.5 py-1 border border-violet-200/80">
                        {pkg.variation_pack}
                      </span>
                    ) : null}
                    {pkg.hook_strength_label?.trim() ? (
                      <span className="text-[10px] font-bold uppercase tracking-wide rounded-full bg-amber-100 text-amber-950 px-2.5 py-1 border border-amber-200/80">
                        {pkg.hook_strength_label}
                      </span>
                    ) : null}
                  </div>
                )}

                {(pkg.version_plain?.trim() || pkg.version_optimized?.trim()) && (
                  <div className="grid gap-3 sm:grid-cols-2 rounded-xl border border-slate-200 bg-slate-50/90 p-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                        {zh ? "普通版本" : "Plain version"}
                      </p>
                      <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {pkg.version_plain?.trim() || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide mb-1">
                        {zh ? "优化版本" : "Optimized version"}
                      </p>
                      <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {pkg.version_optimized?.trim() || "—"}
                      </p>
                    </div>
                  </div>
                )}

                {POST_PACKAGE_KEYS.map((key) => {
                  const val = (pkg[key] ?? "").toString().trim();
                  if (!val) return null;
                  const title = (labels[key] ?? PACKAGE_SECTION_LABELS[key] ?? String(key)) as string;
                  const role = douyinConversionMode ? douyinFieldRoleTag(key) : null;
                  return (
                    <div
                      key={key}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                          {role ? (
                            <span className="shrink-0 rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-800 ring-1 ring-red-200/80">
                              {role}
                            </span>
                          ) : null}
                          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">{title}</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyField(key, pkg)}
                          className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800 active:scale-[0.98]"
                        >
                          <Copy className="h-3 w-3" />
                          {zh ? "复制" : "Copy"}
                        </button>
                      </div>
                      <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{val}</p>
                    </div>
                  );
                })}

                {V106_PACKAGE_KEYS.map((key) => {
                  const val = (pkg[key] ?? "").toString().trim();
                  if (!val) return null;
                  const title = (labels[key] ?? PACKAGE_SECTION_LABELS[key] ?? String(key)) as string;
                  const role = douyinConversionMode ? douyinFieldRoleTag(key) : null;
                  return (
                    <div
                      key={key}
                      className="rounded-xl border border-sky-100 bg-sky-50/40 px-3 py-2.5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                          {role ? (
                            <span className="shrink-0 rounded-md bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-900 ring-1 ring-sky-200/80">
                              {role}
                            </span>
                          ) : null}
                          <h3 className="text-xs font-bold text-sky-900 uppercase tracking-wide">{title}</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyField(key, pkg)}
                          className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800"
                        >
                          <Copy className="h-3 w-3" />
                          {zh ? "复制" : "Copy"}
                        </button>
                      </div>
                      <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{val}</p>
                    </div>
                  );
                })}

                {pkg.best_for?.trim() && (
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 px-3 py-2.5 flex gap-2">
                    <Target className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-indigo-900 uppercase tracking-wide">
                        {zh ? "最适合这样用——当你…" : "Best scenario — use this when…"}
                      </p>
                      <p className="text-sm text-indigo-950 mt-0.5">{pkg.best_for}</p>
                    </div>
                  </div>
                )}

                {cnHardPaywallUi && (
                  <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/80 p-3 space-y-2">
                    <p className="text-[11px] font-bold text-amber-950 flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 shrink-0" />
                      Pro 完整包 · 解锁全部内容
                    </p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {[
                        {
                          t: "为什么这个开头能爆",
                          d: "人群对位 + 停滑结构拆解"
                        },
                        {
                          t: "发布与转化建议",
                          d: "时段、话题、评论钩子"
                        },
                        {
                          t: "用这个文案涨粉案例",
                          d: "对标同类账号的可复制打法"
                        }
                      ].map((row) => (
                        <div
                          key={row.t}
                          className="rounded-lg bg-white/90 border border-amber-200/80 px-2.5 py-2 text-center"
                        >
                          <p className="text-[11px] font-semibold text-slate-800">{row.t}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{row.d}</p>
                          
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {showV1062Blocks ? (
                  <V1062PerPackageShareBlock
                    pkg={pkg}
                    index={idx}
                    toolShareUrl={toolShareUrl!}
                    douyinHubUrl={douyinHubAbsolute}
                    userInputFallback={userInput}
                  />
                ) : null}

                <p className="text-[11px] text-slate-500 pt-1">
                  {zh
                    ? douyinConversionMode
                      ? "建议：先贴描述区与话题，再按口播结构拍摄；评论引导可发后再补置顶。"
                      : "下一步：把区块粘进草稿 → 按口播要点开拍 → 再贴正文与话题标签。"
                    : "Next steps: copy Hook + Script beats + Caption + CTA + Hashtags → paste into Describe your post → tap Post → check Profile."}
                </p>
              </div>
            </article>
          ))}

        {showContent && douyinConversionMode ? (
          <div className="mt-2">
            <ZhDouyinWorkflowNextStep toolSlug={toolSlug} />
          </div>
        ) : null}

        {showV1062Blocks && packages[0] ? (
          <V1062AggregatedTrafficBlocks
            firstPackage={packages[0]}
            toolShareUrl={toolShareUrl!}
            douyinHubUrl={douyinHubAbsolute}
          />
        ) : null}

        {showLocked && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              {zh ? "付费专属变体" : "full-package variants (locked)"}
            </p>
            {lockedPreview.map((lp, i) => (
              <div
                key={i}
                className="relative rounded-2xl border-2 border-dashed border-amber-300 bg-slate-100/80 overflow-hidden"
              >
                <div className="relative min-h-[112px]">
                  <div className="absolute inset-0 backdrop-blur-md bg-white/70 flex flex-col items-center justify-center p-4 text-center z-10">
                    <Lock className="h-7 w-7 text-amber-700 mb-2" />
                    <p className="text-sm font-bold text-slate-900">
                      {zh ? "解锁 Pro 完整包" : "Unlock full content"}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-1 max-w-xs">
                      {zh
                        ? upgradeMode === "china"
                          ? "含完整钩子/五段口播/正文 +「为什么能爆」+ 转化拆解。"
                          : "Upgrade to unlock full hook, script, caption, CTA, hashtags + strategy."
                        : "Upgrade to unlock full hook, script, caption, CTA, hashtags + strategy."}
                    </p>
                    
                  </div>
                  <p className="p-4 text-sm text-slate-400 blur-sm select-none pointer-events-none">{lp.hookTeaser}</p>
                </div>
                {(lp.scriptTeaser || lp.structureHint) && zh ? (
                  <div className="relative z-20 border-t border-amber-200 bg-white px-4 py-3 text-left">
                    {lp.scriptTeaser ? (
                      <p className="text-[11px] text-slate-800">
                        <span className="font-bold text-amber-900">口播气口预览（真实截断）：</span>
                        {lp.scriptTeaser}
                      </p>
                    ) : null}
                    {lp.structureHint ? (
                      <p className="text-[10px] text-slate-600 mt-1 leading-snug">{lp.structureHint}</p>
                    ) : null}
                    
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {false && showContent && isFree && (
          <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-3">
            <p className="text-xs font-semibold text-sky-950">
              {zh
                ? upgradeMode === "china"
                  ? "要爆款级完整打法：算力包内按次生成 + 不截断文案包 +「为什么能爆」与转化/涨粉拆解。免费档只做选题验证。"
                  : "想让每个变体都有「可执行的完整打法」？充值后可按次生成完整结构化文案包。"
                : "Want the full playbook on every variant? Buy credits for more runs and full structured packages."}
            </p>
            
          </div>
        )}

        {activeSupportMilestone != null ? (
          <SupportPrompt
            milestone={activeSupportMilestone}
            onMarkMilestoneSeen={handleSupportMarkSeen}
            onOpenSupport={() => setSupportModalOpen(true)}
            route={supportRoute}
            sourcePage={supportRoute}
          />
        ) : null}

        <SupportModal
          open={supportModalOpen}
          onClose={() => setSupportModalOpen(false)}
          sourcePage={supportRoute}
          route={supportRoute}
        />

        {showContent ? (
          <FeedbackLauncher
            variant="inline"
            localeUi={zh ? "zh" : "en"}
            context={{
              route: supportRoute,
              market: zh ? "cn" : "global",
              locale: zh ? "zh" : "en",
              toolType: toolSlug,
              userPlan: tierApplied,
              sourcePage: supportRoute
            }}
          />
        ) : null}
      </div>

      {showContent && userInput && (
        <p className="px-4 pb-4 text-[11px] text-slate-400">
          {zh
            ? `输出模式：${resultQuality === "full_post_package" ? "完整文案包" : "精简文案包"} · 小提示：微调主题再生成，角度会更不一样。`
            : `Quality mode: ${resultQuality.replace(/_/g, " ")} · Tip: tweak your idea and regenerate for a different angle.`}
        </p>
      )}
    </section>
  );
}
