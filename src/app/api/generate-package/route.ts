import { NextRequest, NextResponse } from "next/server";
import {
  gateGenerationUsage,
  finalizeGenerationUsage,
  LIMIT_MESSAGE
} from "@/lib/api/generation-usage";
import {
  type CreatorPostPackage,
  emptyPackage,
  parsePackagesJson,
  packageBlockCount
} from "@/lib/ai/postPackage";
import type { PostPackageToolKind } from "@/lib/ai/postPackage";
import {
  buildLockedPreviews,
  toFreeVisiblePackages,
  type LockedPackagePreview
} from "@/lib/ai/packageTierSplit";
import {
  routerGeneratePostPackage,
  type GenerationRouterMeta,
  type RoutedMarket
} from "@/lib/ai/router";
import { logAiTelemetry } from "@/lib/ai/telemetry";
import { classifyProviderError } from "@/lib/ai/ai-error-classify";
import { applyContentSafetyToPackages } from "@/lib/content-safety/filter";
import { resolveSafetyMarket } from "@/lib/content-safety/resolve-market";
import { cnCreditCostForGeneration } from "@/lib/credits/cn-credit-cost";
import { getRequestIdentity } from "@/lib/request/get-request-identity";
import {
  applyRiskAction,
  calculateRiskScore,
  checkBlockedState,
  detectAnomaly,
  checkDailyUsageLimit,
  checkRateLimit,
  incrementDailyUsage,
  maybeDelay
} from "@/lib/risk/anti-abuse";
import { checkGlobalCostGuard, incrementGlobalCreditsUsed } from "@/lib/risk/cost-guard";
import { getCnCreditsBalance } from "@/lib/credits/credits-repository";
import {
  buildRetrievalReferenceBlock,
  checkContentDedup,
  evaluatePregenGate,
  isV172StrictMode
} from "@/lib/seo/v172-generation-gate";
import { v173AppendGenerationEvent } from "@/lib/seo/v173-generation-events";
import {
  v173ConsumeRelaxedOnceIfEligible,
  v173DegradationKey,
  v173RecordRelaxedSalvageFailed,
  v173RecordStrictFailure,
  v173RecordSuccess,
  v173TopicFingerprint
} from "@/lib/seo/v173-degradation-runtime";
import {
  mergeV186WithV172Retrieval,
  resolveV186
} from "@/lib/creator-knowledge-engine/resolve-v186";
import type { PlatformId } from "@/lib/platform-intelligence/resolve-patterns";
import { getTopPerformingPatterns } from "@/lib/content/optimization";
import { getCreatorStateSnapshot, saveCreatorStateSnapshot } from "@/lib/content/creator-state-cache";
import { scoreCreatorStateApply } from "@/lib/content/creator-state-apply-score";
import { buildCreatorStatePromptBlock } from "@/lib/content/creator-state-gate";
import { buildCreatorStateStrategy } from "@/lib/content/creator-state-strategy";
import { buildCreatorStateToolContext } from "@/lib/content/creator-state-tool-context";
import { scoreCreatorStateToolContext } from "@/lib/content/creator-state-tool-weight";
import { classifyCreatorStateToolWeight } from "@/lib/content/creator-state-tool-band";
import { buildGenerationPolicy } from "@/lib/content/generation-policy";
import { logContentEventServer } from "@/lib/content/content-event-log";
import v193PlatformPatterns from "../../../../generated/v193-platform-patterns.json";

function sanitizeClientRoute(s: unknown): string | undefined {
  if (typeof s !== "string") return undefined;
  const t = s.trim().slice(0, 200);
  if (!t.startsWith("/")) return undefined;
  if (/[\n\r\0]/.test(t)) return undefined;
  return t;
}

/** V104.2 ??Douyin tool URLs on /zh (caption ?? hook ?? script ?? V105.1 growth tools). */
function isDouyinToolRoute(route?: string): boolean {
  if (!route) return false;
  return /\/douyin-(caption|hook|script|topic|comment-cta|structure)-generator/.test(route);
}

const TOOL_KINDS: PostPackageToolKind[] = [
  "tiktok_caption",
  "hook_focus",
  "ai_caption",
  "douyin_topic",
  "douyin_comment_cta",
  "douyin_structure"
];

function fallbackPackages(
  userInput: string,
  tier: "free" | "pro",
  opts?: {
    toolKind?: PostPackageToolKind;
    platform?: PlatformId | null;
    v193Enabled?: boolean;
    /** for verification: when true, we allow v193 to improve heuristic output */
    debugDisableV172Strict?: boolean;
  }
): CreatorPostPackage[] {
  const short = userInput.trim().slice(0, 120) || "your topic";
  const enableV193Fallback =
    Boolean(opts?.debugDisableV172Strict) &&
    Boolean(opts?.v193Enabled) &&
    opts?.platform === "tiktok" &&
    opts?.toolKind === "hook_focus";

  const v193Patterns = Array.isArray((v193PlatformPatterns as any)?.patterns)
    ? (v193PlatformPatterns as any).patterns
    : [];
  const normalizePt = (s: unknown) => String(s ?? "").toLowerCase().trim();

  const replacePlaceholders = (template: string): string => {
    const niche = short;
    return String(template)
      .replace(/\{problem\}/gi, niche)
      .replace(/\{common_advice\}/gi, "one common mistake")
      .replace(/\{niche\}/gi, niche)
      .replace(/\{specific_action\}/gi, `quick fix for ${niche}`)
      .replace(/\{goal\}/gi, "higher watch time")
      .replace(/\{mistake_or_problem\}/gi, "the thing that ruins your results")
      .replace(/\{micro_fix\}/gi, "a 10-second adjustment")
      .replace(/\{next_topic\}/gi, niche)
      .replace(/\{sub_niche\}/gi, "a sub-niche")
      .replace(/\{keyword\}/gi, niche)
      .replace(/\{before\}/gi, "what you had before")
      .replace(/\{after\}/gi, "what changes after")
      .replace(/\{tool\/approach\}/gi, "your approach");
  };

  const action = [
    `stop doing this with ${short}`,
    `test this simple ${short} format`,
    `fix your ${short} in 15 seconds`,
    `use this ${short} structure today`
  ];
  const outcomes = [
    "higher watch time",
    "more saves and shares",
    "clearer message in less time",
    "faster publish workflow"
  ];
  let hooks = [
    `Most creators miss this in ${short} ??quick fix:`,
    `Before you post about ${short}, do this first:`,
    `The ${short} format that keeps people watching:`,
    `If your ${short} feels weak, try this angle:`,
    `One better way to package ${short} today:`,
    `${short}: 3 lines that make your post clearer`,
    `A faster ${short} workflow for busy creators`,
    `How to make ${short} easier to watch and save`,
    `The ${short} structure I wish I used earlier`,
    `Use this ${short} pattern for your next post`
  ];
  let ctas = [
    "Save this and test one variation today.",
    "Comment your niche and I will tailor one version.",
    "Follow for more creator workflows like this.",
    "Share this with a creator who posts weekly."
  ];

  if (enableV193Fallback) {
    const topHooks = v193Patterns
      .filter((p: any) => p.platform === "tiktok" && p.tool_type === "hook_focus" && normalizePt(p.pattern_type) === "hook")
      .sort((a: any, b: any) => (b.quality_score ?? 0.5) * 0.7 + (b.revenue_score ?? 0.5) * 0.3 - ((a.quality_score ?? 0.5) * 0.7 + (a.revenue_score ?? 0.5) * 0.3))
      .slice(0, 5)
      .map((p: any) => replacePlaceholders(String(p.structure ?? "")).replace(/\s+/g, " ").trim())
      .filter(Boolean);

    const topCtas = v193Patterns
      .filter((p: any) => p.platform === "tiktok" && p.tool_type === "hook_focus" && normalizePt(p.pattern_type) === "cta")
      .sort((a: any, b: any) => (b.quality_score ?? 0.5) * 0.7 + (b.revenue_score ?? 0.5) * 0.3 - ((a.quality_score ?? 0.5) * 0.7 + (a.revenue_score ?? 0.5) * 0.3))
      .slice(0, 4)
      .map((p: any) => replacePlaceholders(String(p.structure ?? "")).replace(/\s+/g, " ").trim())
      .filter(Boolean);

    if (topHooks.length >= 1) hooks = topHooks;
    if (topCtas.length >= 1) ctas = topCtas;
  }

  const tagSets = [
    "#creators #contentstrategy #shortformvideo #tiktoktips",
    "#creatorgrowth #socialmediaideas #videomarketing #reelsstrategy",
    "#contentcreation #hookformula #captiontips #digitalcreator",
    "#audiencegrowth #creatorworkflow #postbetter #contentplanning"
  ];
  const n = tier === "pro" ? 10 : 5;
  const out: CreatorPostPackage[] = [];
  for (let i = 0; i < n; i++) {
    const packs = ["Emotional", "Sales", "Educational", "Entertainment"] as const;
    const strengths = ["Strong hook", "Medium hook", "Safe hook"] as const;
    const variantAction = action[i % action.length];
    const variantOutcome = outcomes[i % outcomes.length];
    const variantCta = ctas[i % ctas.length];
    const variantTag = tagSets[i % tagSets.length];
    const h = hooks[i % hooks.length];
    out.push(
      emptyPackage({
        topic: short,
        hook: h,
        script_talking_points:
          `??Setup: name one problem creators hit with ${short}\n` +
          `??Shift: ${variantAction}\n` +
          `??Proof: show one before/after or mini example\n` +
          `??Wrap: give one next step for ${variantOutcome}`,
        caption:
          `${h}\n\n` +
          `Use this on ${short}: keep one promise, one proof point, one CTA.\n\n` +
          `${variantCta}`,
        cta_line: variantCta,
        hashtags: variantTag,
        why_it_works: `Clear promise + specific next step helps ${variantOutcome}.`,
        posting_tips:
          "Lead with one concrete claim in the first line ?? Keep script under 4 beats ?? Reply to first comments quickly",
        best_for: `Creators who want faster ${short} drafts without losing clarity.`,
        variation_pack: packs[i % 4],
        hook_strength_label: strengths[i % 3],
        why_opening_grabs: "Specific framing beats vague hype and improves early retention.",
        why_structure_completion: "Setup -> shift -> proof -> next step is easier to follow than generic bullets.",
        why_copy_growth: "Actionable CTA and niche tag set increase saves and profile clicks.",
        context_account: "Solo creators, small teams, and service creators",
        context_scenario: "Educational posts, quick demos, and before/after content",
        context_audience: "Viewers looking for practical creator tactics",
        publish_rhythm: "0-2s hook ?? 2-8s context ?? 8-15s proof/demo ?? 15-20s CTA",
        version_plain: `${h} - practical angle on ${short}.`,
        version_optimized: `${h} - same idea with tighter proof and stronger CTA for ${variantOutcome}.`
      })
    );
  }
  return out.filter((p) => packageBlockCount(p) >= 5);
}

function normalizeForQuality(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function estimatePackageQuality(packages: CreatorPostPackage[]): {
  ok: boolean;
  score: number;
  reason: string;
} {
  if (packages.length === 0) return { ok: false, score: 0, reason: "empty_packages" };
  const hooks = packages.map((p) => normalizeForQuality(p.hook || ""));
  const captions = packages.map((p) => normalizeForQuality(p.caption || ""));
  const scripts = packages.map((p) => normalizeForQuality(p.script_talking_points || ""));

  const uniqueHooks = new Set(hooks.filter(Boolean)).size;
  const uniqueCaptions = new Set(captions.filter(Boolean)).size;
  const uniqueScripts = new Set(scripts.filter(Boolean)).size;
  const total = Math.max(1, packages.length);
  const diversity =
    (uniqueHooks / total) * 0.45 +
    (uniqueCaptions / total) * 0.35 +
    (uniqueScripts / total) * 0.2;

  const boilerplatePatterns = [
    /you need to see this/,
    /open with pattern interrupt/,
    /save this\.?$/,
    /follow for part 2/
  ];
  const boilerplateHits = packages.reduce((acc, p) => {
    const t = `${p.hook || ""}\n${p.caption || ""}\n${p.script_talking_points || ""}`.toLowerCase();
    return acc + (boilerplatePatterns.some((re) => re.test(t)) ? 1 : 0);
  }, 0);
  const boilerplateRatio = boilerplateHits / total;

  const score = diversity - boilerplateRatio * 0.4;
  if (score >= 0.45) return { ok: true, score, reason: "quality_ok" };
  if (diversity < 0.35) return { ok: false, score, reason: "low_diversity" };
  return { ok: false, score, reason: "boilerplate_detected" };
}

/** V103.1 ??Pro: 10 packages; Free: 5 (for locked previews) */
function padToMin(
  packages: CreatorPostPackage[],
  userInput: string,
  tier: "free" | "pro",
  opts?: Parameters<typeof fallbackPackages>[2]
): CreatorPostPackage[] {
  const min = tier === "pro" ? 10 : 5;
  const fb = fallbackPackages(userInput, tier, opts);
  const base = packages.slice(0, min);
  const out = [...base];
  let i = 0;
  while (out.length < min) {
    out.push(fb[i % fb.length]);
    i++;
  }
  return out.slice(0, min);
}

export async function POST(request: NextRequest) {
  const started = Date.now();
  let routerMeta: GenerationRouterMeta = {
    provider_used: "none",
    model_used: "none",
    fallback_used: false,
    latency_ms: 0
  };

  try {
    const reqBody = await request.json();
    let userInput = typeof reqBody.userInput === "string" ? reqBody.userInput : "";
    const locale = typeof reqBody.locale === "string" ? reqBody.locale : "en";
    const toolKind = (typeof reqBody.toolKind === "string" ? reqBody.toolKind : "tiktok_caption") as PostPackageToolKind;
    const clientRoute = sanitizeClientRoute(reqBody.clientRoute);
    const market = resolveSafetyMarket(request, {
      market: typeof reqBody.market === "string" ? reqBody.market : undefined,
      locale
    }) as RoutedMarket;
    const debugDisableV172Strict =
      typeof reqBody.debugDisableV172Strict === "boolean" ? reqBody.debugDisableV172Strict : false;

    const creatorAnalysisSummary =
      typeof reqBody.creatorAnalysisSummary === "string"
        ? String(reqBody.creatorAnalysisSummary).trim().slice(0, 2400)
        : "";

    let requestPlatform: PlatformId | null = null;
    let debugDisableV193 = false;

    let v186Resolved: ReturnType<typeof resolveV186> = null;
    const v186Raw = reqBody.v186;
    if (v186Raw && typeof v186Raw === "object" && typeof v186Raw.toolSlug === "string") {
      const platRaw = typeof v186Raw.platform === "string" ? v186Raw.platform.toLowerCase() : "";
      const platform: PlatformId | null =
        platRaw === "tiktok" || platRaw === "youtube" || platRaw === "instagram" ? (platRaw as PlatformId) : null;
      requestPlatform = platform;
      debugDisableV193 = typeof v186Raw.debugDisableV193 === "boolean" ? v186Raw.debugDisableV193 : false;
      const pg = v186Raw.primaryGoal;
      const primaryGoal =
        pg === "views" || pg === "followers" || pg === "sales" ? pg : undefined;
      const monetizationMode =
        typeof v186Raw.monetizationMode === "string" ? v186Raw.monetizationMode.trim().slice(0, 64) : undefined;
      const userProfile =
        monetizationMode !== undefined || primaryGoal !== undefined
          ? { monetizationMode, primaryGoal }
          : undefined;
      v186Resolved = resolveV186({
        toolSlug: String(v186Raw.toolSlug).trim().slice(0, 120),
        intentId: typeof v186Raw.intentId === "string" ? v186Raw.intentId : null,
        scenarioId: typeof v186Raw.scenarioId === "string" ? v186Raw.scenarioId : null,
        userText: userInput,
        platform,
        userProfile,
        creatorAnalysisSummary: creatorAnalysisSummary || null,
        debugDisableV193
      });
      if (v186Resolved) {
        userInput = v186Resolved.effectiveUserInput;
      }
    }

    if (!userInput.trim()) {
      return NextResponse.json({ error: "Missing userInput" }, { status: 400 });
    }

    if (!TOOL_KINDS.includes(toolKind)) {
      return NextResponse.json({ error: "Invalid toolKind" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY?.trim()) {
      return NextResponse.json({ error: "AI not configured" }, { status: 503 });
    }

    // 1) resolve identity
    const identity = await getRequestIdentity(request);
    const preliminaryBalance = await getCnCreditsBalance(identity.userId, identity.userId ? null : identity.anonymousId);
    const preliminaryUserType = preliminaryBalance && preliminaryBalance.remaining > 0 ? "paid" : identity.userId ? "free" : "anonymous";

    // 2) blocked-state check
    const blocked = await checkBlockedState(identity);
    if (blocked.blocked) {
      logAiTelemetry({
        task_type: "post_package",
        market,
        locale,
        provider: "none",
        model: "none",
        user_plan: "free",
        latency_ms: Date.now() - started,
        fallback_used: false,
        success: false,
        error_code: "abuse_suspected",
        blocked: true,
        abuse_reason: ["blocked_state"]
      });
      return NextResponse.json({ error: "abuse_suspected" }, { status: 403 });
    }

    // 3) global cost guard
    const globalGuard = await checkGlobalCostGuard();
    if (globalGuard.blocked) {
      logAiTelemetry({
        task_type: "post_package",
        market,
        locale,
        provider: "none",
        model: "none",
        user_plan: "free",
        latency_ms: Date.now() - started,
        fallback_used: false,
        success: false,
        error_code: "system_busy_try_later",
        global_guard: true
      });
      return NextResponse.json({ error: "system_busy_try_later" }, { status: 503 });
    }

    // 4) rate-limit check
    const rate = await checkRateLimit(identity);
    if (rate.limited) {
      logAiTelemetry({
        task_type: "post_package",
        market,
        locale,
        provider: "none",
        model: "none",
        user_plan: "free",
        latency_ms: Date.now() - started,
        fallback_used: false,
        success: false,
        error_code: "rate_limited",
        rate_limited: true,
        abuse_reason: [rate.rule ?? "rate_limit"]
      });
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }

    // 5) daily usage limit
    const daily = await checkDailyUsageLimit(identity, preliminaryUserType);
    if (daily.limited && preliminaryUserType !== "paid") {
      logAiTelemetry({
        task_type: "post_package",
        market,
        locale,
        provider: "none",
        model: "none",
        user_plan: "free",
        latency_ms: Date.now() - started,
        fallback_used: false,
        success: false,
        error_code: "daily_limit_reached",
        daily_limit_hit: true
      });
      return NextResponse.json({ error: "daily_limit_reached" }, { status: 429 });
    }

    const initialPublishFullPack =
      preliminaryUserType === "paid" &&
      (typeof reqBody.publishFullPack === "boolean" ? reqBody.publishFullPack : market === "cn");

    const toolSlug =
      typeof reqBody.toolSlug === "string" && reqBody.toolSlug.trim()
        ? reqBody.toolSlug.trim().slice(0, 120)
        : toolKind;

    // 6) anomaly detection
    const anomaly = await detectAnomaly(identity);

    // 7) risk-score calculation
    const risk = await calculateRiskScore({
      identity,
      userInput,
      clientRoute,
      userType: preliminaryUserType,
      anomalyHint: anomaly
    });

    // 8) risk action
    const riskAction = await applyRiskAction({ identity, riskScore: risk.riskScore });
    if (!riskAction.allowed) {
      logAiTelemetry({
        task_type: "post_package",
        market,
        locale,
        provider: "none",
        model: "none",
        user_plan: identity.userId ? "free" : "free",
        latency_ms: Date.now() - started,
        fallback_used: false,
        success: false,
        error_code: "abuse_suspected",
        blocked: true,
        risk_score: risk.riskScore,
        risk_level: risk.riskLevel,
        abuse_reason: risk.reasons,
        anomaly_detected: risk.anomalyDetected
      });
      return NextResponse.json(
        {
          error: riskAction.requireLogin ? "login_required" : "abuse_suspected"
        },
        { status: riskAction.requireLogin ? 401 : 403 }
      );
    }

    await maybeDelay(riskAction.delayMs);
    if (riskAction.delayMs > 0) {
      logAiTelemetry({
        task_type: "post_package",
        market,
        locale,
        provider: "none",
        model: "none",
        user_plan: identity.userId ? "free" : "free",
        latency_ms: Date.now() - started,
        fallback_used: false,
        success: false,
        error_code: "abuse_detected",
        risk_score: risk.riskScore,
        risk_level: risk.riskLevel,
        abuse_reason: risk.reasons,
        anomaly_detected: risk.anomalyDetected
      });
    }

    // Risk-based degradation
    const degraded = risk.riskScore >= 60;
    const publishFullPack = degraded ? false : initialPublishFullPack;
    reqBody.disableAdvancedFields = degraded;

    // 9) dynamic credit cost calculation
    const baseCost = cnCreditCostForGeneration(publishFullPack);
    const riskDelta = risk.riskScore >= 80 ? 0 : risk.riskScore >= 60 ? 2 : risk.riskScore >= 30 ? 1 : 0;
    const creditCost = baseCost + riskDelta;

    // 10) gateGenerationUsage
    const gate = await gateGenerationUsage(request, { market });
    if (!gate.ok) {
      return NextResponse.json(
        { error: LIMIT_MESSAGE, limitReached: true, used: gate.used, limit: gate.limit },
        { status: 429 }
      );
    }

    if (gate.creditsMode && creditCost > 0 && (gate.creditBalance ?? 0) < creditCost) {
      return NextResponse.json(
        {
          error: "insufficient_credits",
          limitReached: true,
          required: creditCost,
          remaining: gate.creditBalance ?? 0
        },
        { status: 402 }
      );
    }

    const tier = gate.plan === "pro" ? "pro" : "free";
    const requiredCount = tier === "pro" ? 10 : 5;
    const strict = isV172StrictMode(process.cwd());
    const v173Key = v173DegradationKey(clientRoute, userInput);
    const relaxedOnce = strict ? v173ConsumeRelaxedOnceIfEligible(v173Key, process.cwd()) : false;
    const strictEffective = debugDisableV172Strict ? false : strict && !relaxedOnce;
    const baseRetrieval = buildRetrievalReferenceBlock(userInput, locale);
    const mergedRetrievalBlock =
      v186Resolved != null
        ? mergeV186WithV172Retrieval(v186Resolved.knowledgeBlock, baseRetrieval.block)
        : baseRetrieval.block;
    const retrievalCtx = {
      block: mergedRetrievalBlock,
      snippetCount: baseRetrieval.snippetCount + (v186Resolved ? v186Resolved.fragmentIds.length : 0),
      usedSignalsFile: baseRetrieval.usedSignalsFile
    };

    const pregen = evaluatePregenGate(userInput, { toolSlug, v186Boost: Boolean(v186Resolved) }, process.cwd());
    if (!pregen.allowed) {
      v173AppendGenerationEvent(
        {
          source: "generate_package",
          outcome: "pregen_block",
          http_status: 422,
          route: clientRoute,
          topic_fp: v173TopicFingerprint(userInput),
          topic_preview: userInput.slice(0, 80),
          error_code: pregen.reason,
          tier,
          strict_effective: strictEffective
        },
        process.cwd()
      );
      logAiTelemetry({
        task_type: "post_package",
        market,
        locale,
        provider: "none",
        model: "none",
        user_plan: tier,
        latency_ms: Date.now() - started,
        fallback_used: false,
        success: false,
        error_code: "v172_pregen_blocked",
        route: clientRoute,
        risk_score: risk.riskScore,
        risk_level: risk.riskLevel
      });
      return NextResponse.json(
        { error: "pregen_blocked", reason: pregen.reason, score: pregen.score },
        { status: 422 }
      );
    }

    const dedup = checkContentDedup(userInput, process.cwd(), "topic");
    if (dedup.blocked) {
      v173AppendGenerationEvent(
        {
          source: "generate_package",
          outcome: "dedup_block",
          http_status: 409,
          route: clientRoute,
          topic_fp: v173TopicFingerprint(userInput),
          topic_preview: userInput.slice(0, 80),
          message: dedup.similarSlug,
          tier,
          strict_effective: strictEffective
        },
        process.cwd()
      );
      logAiTelemetry({
        task_type: "post_package",
        market,
        locale,
        provider: "none",
        model: "none",
        user_plan: tier,
        latency_ms: Date.now() - started,
        fallback_used: false,
        success: false,
        error_code: "v172_content_dedup",
        route: clientRoute,
        risk_score: risk.riskScore,
        risk_level: risk.riskLevel
      });
      return NextResponse.json(
        {
          error: "content_dedup",
          similarSlug: dedup.similarSlug,
          similarity: dedup.similarity
        },
        { status: 409 }
      );
    }

    let packages: CreatorPostPackage[] = [];
    let modelParseOk = false;
    let qualityFinal = estimatePackageQuality([]);
    let genBad = true;
    let v173SuccessEventPending = true;

    let creatorStateBlock = "";
    let generationPolicyBlock = "";
    let policyStructureHint = "";
    let shouldIncludeCreatorStateBlock = false;
    let shouldIncludeOptimizationHint = true;
    let generationPolicyMode: "safe_growth" | "growth" | "monetization_ready" | null = null;
    let generationPolicyRules: string[] = [];
    let creatorStateSource: "fresh" | "cached" = "fresh";
    let creatorStateMode: "minimal" | "standard" | "full" = "minimal";
    let creatorStateApplyScore = 0;
    let creatorStateApplyLevel: "weak" | "medium" | "strong" = "weak";
    let refreshReason = "stable";
    let triggerScore = 0;
    let creatorStateForEvents: any = null;
    let compactStrategy: any = null;
    let toolContextForEvents: any = null;
    let weightedToolContextForEvents: any = null;
    let toolBandForEvents: "strong" | "medium" | "weak" | "empty" = "empty";

    if (identity.userId) {
      try {
        const snapshot = await getCreatorStateSnapshot(identity.userId, toolSlug);
        const generationPolicy = buildGenerationPolicy({
          stage: snapshot.state.stage,
          uploadCount7d: 0
        });
        creatorStateSource = snapshot.source;
        refreshReason = snapshot.refreshReason;
        triggerScore = snapshot.triggerScore;
        const apply = scoreCreatorStateApply(snapshot.state);
        creatorStateApplyScore = apply.applyScore;
        creatorStateApplyLevel = apply.level;
        const gated = buildCreatorStatePromptBlock(snapshot.state, apply, snapshot.source, toolSlug);

        creatorStateBlock = gated.block;
        generationPolicyMode = generationPolicy.policyMode;
        if (generationPolicyMode === "safe_growth") {
          policyStructureHint = "Use simple, clear structure. Prioritize value over novelty.";
        } else if (generationPolicyMode === "growth") {
          policyStructureHint = "Use strong hook first, then concise value delivery.";
        } else if (generationPolicyMode === "monetization_ready") {
          policyStructureHint =
            "Use value-first structure, then soft trust-building transition.";
        }
        if (generationPolicyMode === "safe_growth") {
          shouldIncludeOptimizationHint = false;
        }
        generationPolicyRules = generationPolicy.policyRules;
        generationPolicyBlock = generationPolicy.policyBlock;
        if (generationPolicyMode === "safe_growth") {
          shouldIncludeCreatorStateBlock = apply.applyScore >= 70;
        } else if (generationPolicyMode === "growth") {
          shouldIncludeCreatorStateBlock = apply.applyScore >= 40;
        } else {
          shouldIncludeCreatorStateBlock = Boolean(creatorStateBlock);
        }
        creatorStateMode = gated.mode;
        creatorStateForEvents = snapshot.state;
        compactStrategy = buildCreatorStateStrategy(snapshot.state);
        toolContextForEvents = buildCreatorStateToolContext(toolSlug, compactStrategy);
        weightedToolContextForEvents = scoreCreatorStateToolContext(
          toolContextForEvents.toolType,
          toolContextForEvents.contextLines
        );
        toolBandForEvents = classifyCreatorStateToolWeight(weightedToolContextForEvents.weightScore).band;
      } catch {
        // Non-blocking
      }
    }

    const callModel = async (input: string) => {
      // V196 Phase 2 ??content optimization patterns (MVP).
      let optimizationHint = "";
      try {
        const userIdForPatterns = identity.userId ?? null;
        const { patterns, patternSource } = await getTopPerformingPatterns(userIdForPatterns, toolSlug);
        const hints: string[] = [];
        if (patterns.topHooks.length > 0 && toolKind === "hook_focus") {
          const sample = patterns.topHooks.slice(0, 3).join(" | ");
          hints.push(
            `Your historically best-performing hook openings often start like: "${sample}". Prefer similar opening structures while staying fresh.`
          );
        }
        if (patterns.hashtagCountRange > 0 && (toolKind === "tiktok_caption" || toolKind === "ai_caption")) {
          hints.push(
            `Your best posts tend to use around ${patterns.hashtagCountRange} hashtags. Keep hashtag count close to this range.`
          );
        }
        if (toolKind === "tiktok_caption" || toolKind === "ai_caption") {
          const lenLabel =
            patterns.captionLengthType === "short"
              ? "short, punchy captions (under ~60 characters)"
              : patterns.captionLengthType === "medium"
                ? "medium-length captions (around 60??80 characters)"
                : "longer captions (above ~180 characters)";
          hints.push(`Caption length that tends to work best for this creator is: ${lenLabel}.`);
        }
        if (hints.length > 0) {
          optimizationHint =
            `\n\n[Content optimization hints ??source: ${patternSource === "user" ? "your past high-performing posts" : "default guidance"}]\n` +
            hints.join("\n");
        }
      } catch {
        // Non-blocking: if optimization fails, fall back to original behavior.
      }

      const pieces = [input];
      if (generationPolicyBlock) pieces.push(generationPolicyBlock);
      if (policyStructureHint) pieces.push(policyStructureHint);
      if (creatorStateBlock && shouldIncludeCreatorStateBlock) pieces.push(creatorStateBlock);
      if (optimizationHint && shouldIncludeOptimizationHint) pieces.push(optimizationHint);
      const effectiveInput = pieces.join("\n\n");

      return routerGeneratePostPackage({
        userInput: effectiveInput,
        toolType: toolKind,
        userPlan: tier,
        market,
        locale,
        taskType: "post_package",
        publishFullPack,
        riskScore: risk.riskScore,
        retrievalReferenceBlock: retrievalCtx.block
      });
    };

    const mergeRouterMeta = (meta: GenerationRouterMeta): GenerationRouterMeta => ({
      ...meta,
      route: clientRoute,
      v172_pregen_score: pregen.score,
      v172_retrieval_snippets: retrievalCtx.snippetCount,
      retrieval_used: retrievalCtx.snippetCount > 0
    });

    try {
      const result = await callModel(userInput);
      routerMeta = mergeRouterMeta(result.meta);
      packages = typeof result.rawText === "string" ? parsePackagesJson(result.rawText) : [];
      modelParseOk = packages.length > 0;

      if (modelParseOk) {
        const quality = estimatePackageQuality(packages);
        if (!quality.ok) {
          const retryInput =
            `${userInput}\n\n` +
            "Quality constraints: provide materially different variants. Avoid repeated hooks/captions, avoid boilerplate phrases, and use concrete scenario-specific wording.";
          const retry = await callModel(retryInput);
          const retryPackages = typeof retry.rawText === "string" ? parsePackagesJson(retry.rawText) : [];
          const retryQuality = estimatePackageQuality(retryPackages);
          if (retryPackages.length > 0 && retryQuality.score >= quality.score) {
            packages = retryPackages;
            routerMeta = mergeRouterMeta({
              ...retry.meta,
              fallback_used: true
            });
          }
        }
      }

      if (modelParseOk && packages.length < requiredCount) {
        const countRetry = await callModel(
          `${userInput}\n\nReturn JSON with exactly ${requiredCount} objects in the top-level "packages" array. Each object must include every required string field.`
        );
        const cr = typeof countRetry.rawText === "string" ? parsePackagesJson(countRetry.rawText) : [];
        if (cr.length >= requiredCount) {
          packages = cr;
          routerMeta = mergeRouterMeta({ ...countRetry.meta, fallback_used: true });
        } else if (cr.length > packages.length) {
          packages = cr;
          routerMeta = mergeRouterMeta({ ...countRetry.meta, fallback_used: true });
        }
      }

      modelParseOk = packages.length > 0;
      qualityFinal = estimatePackageQuality(packages);
      genBad = !modelParseOk || packages.length < requiredCount || !qualityFinal.ok;

      if (strictEffective && genBad) {
        /** V172 strict gate: salvage UX with heuristic packages instead of hard 503 (tools must always return usable output). */
        v173RecordStrictFailure(v173Key, process.cwd());
        v173AppendGenerationEvent(
          {
            source: "generate_package",
            outcome: "strict_gate_salvage",
            http_status: 200,
            route: clientRoute,
            topic_fp: v173TopicFingerprint(userInput),
            topic_preview: userInput.slice(0, 80),
            package_count: packages.length,
            retrieval_used: retrievalCtx.snippetCount > 0,
            tier,
            strict_effective: true,
            relaxed_once: false,
            error_code: "v172_strict_salvaged_heuristic",
            message: qualityFinal.reason
          },
          process.cwd()
        );
        packages = fallbackPackages(userInput, tier, {
          toolKind,
          platform: requestPlatform,
          v193Enabled: !debugDisableV193,
          debugDisableV172Strict
        });
        packages = padToMin(packages, userInput, tier, {
          toolKind,
          platform: requestPlatform,
          v193Enabled: !debugDisableV193,
          debugDisableV172Strict
        });
        qualityFinal = estimatePackageQuality(packages);
        routerMeta = {
          ...routerMeta,
          provider_used: "local_heuristic",
          model_used: "none",
          fallback_used: true,
          outcome: "heuristic_after_empty_parse",
          latency_ms: Date.now() - started
        };
        modelParseOk = packages.length > 0;
        genBad = false;
      }
    } catch (err) {
      if (strictEffective) {
        /** Router threw (e.g. all providers down): still return heuristic packages so the tool is never blank. */
        v173AppendGenerationEvent(
          {
            source: "generate_package",
            outcome: "router_error_salvage",
            http_status: 200,
            route: clientRoute,
            topic_fp: v173TopicFingerprint(userInput),
            topic_preview: userInput.slice(0, 80),
            tier,
            strict_effective: true,
            error_code: "v172_router_salvaged_heuristic",
            message: err instanceof Error ? err.message : String(err)
          },
          process.cwd()
        );
        logAiTelemetry({
          task_type: "post_package",
          market,
          locale,
          provider: "none",
          model: "none",
          user_plan: tier,
          latency_ms: Date.now() - started,
          fallback_used: true,
          success: true,
          error_code: "v172_router_salvaged_heuristic",
          route: clientRoute,
          risk_score: risk.riskScore,
          risk_level: risk.riskLevel
        });
        routerMeta = {
          provider_used: "local_heuristic",
          model_used: "none",
          fallback_used: true,
          latency_ms: Date.now() - started,
          route: clientRoute,
          outcome: "heuristic_after_router_failure",
          error_class: classifyProviderError(err),
          v172_pregen_score: pregen.score,
          v172_retrieval_snippets: retrievalCtx.snippetCount,
          retrieval_used: retrievalCtx.snippetCount > 0
        };
        packages = fallbackPackages(userInput, tier, {
          toolKind,
          platform: requestPlatform,
          v193Enabled: !debugDisableV193,
          debugDisableV172Strict
        });
        packages = padToMin(packages, userInput, tier, {
          toolKind,
          platform: requestPlatform,
          v193Enabled: !debugDisableV193,
          debugDisableV172Strict
        });
        modelParseOk = packages.length > 0;
        qualityFinal = estimatePackageQuality(packages);
        genBad = false;
      } else {
        routerMeta = {
          provider_used: "none",
          model_used: "none",
          fallback_used: true,
          latency_ms: Date.now() - started,
          route: clientRoute,
          outcome: "heuristic_after_router_failure",
          error_class: classifyProviderError(err)
        };
        packages = [];
        modelParseOk = false;
        genBad = true;
      }
    }

    if (!strictEffective) {
      if (packages.length === 0) {
        packages = fallbackPackages(userInput, tier, {
          toolKind,
          platform: requestPlatform,
          v193Enabled: !debugDisableV193,
          debugDisableV172Strict
        });
        const wasRouterFailure = routerMeta.provider_used === "none";
        routerMeta = {
          ...routerMeta,
          provider_used: wasRouterFailure ? "local_heuristic" : routerMeta.provider_used,
          fallback_used: true,
          outcome: wasRouterFailure ? "heuristic_after_router_failure" : "heuristic_after_empty_parse"
        };
      }
      packages = padToMin(packages, userInput, tier, {
        toolKind,
        platform: requestPlatform,
        v193Enabled: !debugDisableV193,
        debugDisableV172Strict
      });
      qualityFinal = estimatePackageQuality(packages);
      genBad = packages.length < requiredCount || !qualityFinal.ok;

      if (relaxedOnce) {
        if (!genBad) {
          v173RecordSuccess(v173Key, process.cwd());
          v173SuccessEventPending = false;
          v173AppendGenerationEvent(
            {
              source: "generate_package",
              outcome: "success",
              http_status: 200,
              route: clientRoute,
              topic_fp: v173TopicFingerprint(userInput),
              topic_preview: userInput.slice(0, 80),
              package_count: packages.length,
              retrieval_used: retrievalCtx.snippetCount > 0,
              tier,
              strict_effective: false,
              relaxed_once: true,
              via_relaxed_salvage: true,
              heuristic_fill: true
            },
            process.cwd()
          );
        } else {
          v173RecordRelaxedSalvageFailed(v173Key, process.cwd());
          v173AppendGenerationEvent(
            {
              source: "generate_package",
              outcome: "relaxed_once_still_failed",
              http_status: 503,
              route: clientRoute,
              topic_fp: v173TopicFingerprint(userInput),
              topic_preview: userInput.slice(0, 80),
              package_count: packages.length,
              tier,
              relaxed_once: true,
              error_code: "v173_relaxed_salvage_failed",
              message: qualityFinal.reason
            },
            process.cwd()
          );
          logAiTelemetry({
            task_type: "post_package",
            market,
            locale,
            provider: routerMeta.provider_used,
            model: routerMeta.model_used,
            user_plan: tier,
            latency_ms: Date.now() - started,
            fallback_used: true,
            success: false,
            error_code: "v173_relaxed_salvage_failed",
            route: clientRoute,
            risk_score: risk.riskScore,
            risk_level: risk.riskLevel
          });
          return NextResponse.json(
            {
              error: "generation_unsatisfactory",
              code: "v173_relaxed_exhausted",
              requiredCount,
              gotCount: packages.length
            },
            { status: 503 }
          );
        }
      }
    }

    const safety = applyContentSafetyToPackages(packages, market === "cn" ? "cn" : "global");
    packages = safety.packages;

    routerMeta = { ...routerMeta, route: clientRoute };

    if (v173SuccessEventPending) {
      v173RecordSuccess(v173Key, process.cwd());
      const heuristicFill =
        routerMeta.fallback_used === true || routerMeta.provider_used === "local_heuristic";
      v173AppendGenerationEvent(
        {
          source: "generate_package",
          outcome: "success",
          http_status: 200,
          route: clientRoute,
          topic_fp: v173TopicFingerprint(userInput),
          topic_preview: userInput.slice(0, 80),
          package_count: packages.length,
          retrieval_used: retrievalCtx.snippetCount > 0,
          tier,
          strict_effective: strictEffective,
          relaxed_once: relaxedOnce,
          via_relaxed_salvage: false,
          heuristic_fill: heuristicFill
        },
        process.cwd()
      );
    }

    const extraVisible = gate.supporterPerks.freeVisibleExtraSlots;
    const douyinTool = market === "cn" && isDouyinToolRoute(clientRoute);
    /** V102.2 ??CN free: 2 base visible; V104.2 ??Douyin: 1 visible + richer locked previews */
    const baseVisible = market === "cn" ? (douyinTool ? 1 : 2) : 3;
    const freeVisibleCount = Math.min(5, baseVisible + extraVisible);

    const contentSafety = {
      applied: true,
      profile: safety.profile,
      filteredCount: safety.filteredCount,
      riskDetected: safety.riskDetected
    };

    const payload: {
      packages: CreatorPostPackage[];
      lockedPreview?: LockedPackagePreview[];
      tierApplied: "free" | "pro";
      resultQuality: "compact_post_package" | "full_post_package";
      generationMeta: GenerationRouterMeta;
      contentSafety: typeof contentSafety;
      publishFullPack: boolean;
      creditsRemaining?: number;
      creditsUsed?: number;
      supporterMeta?: {
        level: string;
        earlyFeatureAccess: boolean;
        effectiveFreeLimit: number;
      };
    } =
      tier === "pro"
        ? {
            packages,
            tierApplied: "pro",
            resultQuality: "full_post_package",
            generationMeta: routerMeta,
            contentSafety,
            publishFullPack
          }
        : {
            packages: toFreeVisiblePackages(packages, {
              extraVisibleSlots: extraVisible,
              cnHardPaywall: market === "cn",
              douyinHardPaywall: douyinTool
            }),
            lockedPreview: buildLockedPreviews(packages, freeVisibleCount, {
              douyinRichTeasers: douyinTool
            }),
            tierApplied: "free",
            resultQuality: "compact_post_package",
            generationMeta: routerMeta,
            contentSafety,
            publishFullPack,
            supporterMeta: {
              level: gate.supporterPerks.level,
              earlyFeatureAccess: gate.supporterPerks.earlyFeatureAccess,
              effectiveFreeLimit: gate.effectiveFreeLimit
            }
          };

    const responseBody = {
      ...payload,
      ...(v186Resolved
        ? {
            v186: {
              recipe_id: v186Resolved.recipeId,
              intent_label: v186Resolved.intentLabel,
              scenario_label: v186Resolved.scenarioLabel,
              fragment_ids: v186Resolved.fragmentIds,
              pattern_ids: v186Resolved.patternIds
            }
          }
        : {}),
      ...(v186Resolved?.v193GenerationMeta
        ? {
            v193: {
              platform: "tiktok" as const,
              observation_applied: v186Resolved.v193GenerationMeta.observation_applied,
              observation_count_used: v186Resolved.v193GenerationMeta.observation_count_used,
              top_pattern_types_applied: v186Resolved.v193GenerationMeta.top_pattern_types_applied,
              additive_only: true as const,
              tool_slug: v186Resolved.v193GenerationMeta.tool_slug,
              generation_surfaces: v186Resolved.v193GenerationMeta.generation_surfaces,
              chain_consistency_applied:
                Boolean(v186Resolved.v193ChainRules) &&
                ["hook-generator", "tiktok-caption-generator", "hashtag-generator", "title-generator"].includes(
                  toolSlug
                )
            }
          }
        : {})
    };

    if (gate.creditsMode && creditCost > 0) {
      const dummy = {} as NextResponse;
      const fin = await finalizeGenerationUsage(gate, dummy, {
        creditsCost: creditCost,
        toolSlug,
        market,
        requestType: "generate_package",
        meta: { market, publishFullPack, toolKind }
      });
      await incrementGlobalCreditsUsed(creditCost);
      await incrementDailyUsage(identity, creditCost);
      if (fin?.creditsRemaining !== undefined) {
        payload.creditsRemaining = fin.creditsRemaining;
        payload.creditsUsed = fin.creditsUsed;
      }
      logAiTelemetry({
        task_type: "post_package",
        market,
        locale,
        provider: routerMeta.provider_used,
        model: routerMeta.model_used,
        user_plan: tier,
        latency_ms: Date.now() - started,
        model_latency_ms:
          modelParseOk || routerMeta.outcome === "heuristic_after_empty_parse" ? routerMeta.latency_ms : undefined,
        fallback_used: routerMeta.fallback_used,
        success: modelParseOk,
        user_fulfilled: true,
        outcome: routerMeta.outcome,
        error_class: routerMeta.error_class,
        route: clientRoute,
        error_code:
          !modelParseOk && routerMeta.error_class
            ? routerMeta.error_class
            : !modelParseOk
              ? "heuristic_fallback"
              : undefined,
        content_safety_filtered_count: safety.filteredCount,
        content_safety_risk_detected: safety.riskDetected,
        content_safety_profile: safety.profile,
        risk_score: risk.riskScore,
        risk_level: risk.riskLevel,
        rate_limited: false,
        blocked: false,
        abuse_reason: risk.reasons,
        dynamic_credit_cost: creditCost,
        global_guard: false,
        daily_limit_hit: false,
        anomaly_detected: risk.anomalyDetected,
        degraded
        ,
        model_tier: routerMeta.model_tier,
        estimated_cost_usd: routerMeta.estimated_cost_usd,
        max_tokens_applied: routerMeta.max_tokens_applied
      });
      return NextResponse.json(responseBody);
    }

    const json = NextResponse.json(responseBody);
    await finalizeGenerationUsage(gate, json);
    await incrementDailyUsage(identity, 1);

    if (identity.userId) {
      const eid =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `state-${Date.now()}-${Math.random()}`;

      await logContentEventServer({
        content_id: `${eid}-generation-policy`,
        event_type: "creator_generation_policy_built",
        user_id: identity.userId,
        tool_slug: toolSlug,
        policy_mode: generationPolicyMode,
        policy_rules: generationPolicyRules,
        policy_structure_hint: policyStructureHint,
        should_include_creator_state_block: shouldIncludeCreatorStateBlock,
        should_include_optimization_hint: shouldIncludeOptimizationHint
      });
      await logContentEventServer({
        content_id: eid,
        event_type: "creator_state_scope_applied",
        user_id: identity.userId,
        tool_slug: toolSlug,
        source: creatorStateSource,
        route_kind: "generate_package"
      });
      await logContentEventServer({
        content_id: `${eid}-refresh`,
        event_type: "creator_state_refresh_decision",
        user_id: identity.userId,
        tool_slug: toolSlug,
        should_refresh: triggerScore > 0,
        reason: refreshReason
      });
      await logContentEventServer({
        content_id: `${eid}-trigger`,
        event_type: "creator_state_trigger_scored",
        user_id: identity.userId,
        tool_slug: toolSlug,
        should_refresh: triggerScore > 0,
        reason: refreshReason,
        trigger_score: triggerScore
      });
      await logContentEventServer({
        content_id: `${eid}-apply`,
        event_type: "creator_state_apply_scored",
        user_id: identity.userId,
        tool_slug: toolSlug,
        apply_score: creatorStateApplyScore,
        apply_level: creatorStateApplyLevel
      });
      await logContentEventServer({
        content_id: `${eid}-gated`,
        event_type: "creator_state_gated",
        user_id: identity.userId,
        tool_slug: toolSlug,
        apply_score: creatorStateApplyScore,
        apply_level: creatorStateApplyLevel,
        mode: creatorStateMode,
        source: creatorStateSource
      });
      if (compactStrategy) {
        await logContentEventServer({
          content_id: `${eid}-strategy`,
          event_type: "creator_state_strategy_built",
          user_id: identity.userId,
          tool_slug: toolSlug,
          hashtag_count: compactStrategy.hashtagCount,
          caption_length_type: compactStrategy.captionLengthType,
          top_hooks_used: compactStrategy.topHooks,
          preferred_action: compactStrategy.preferredAction
        });
      }
      if (toolContextForEvents) {
        await logContentEventServer({
          content_id: `${eid}-tool-context`,
          event_type: "creator_state_tool_context_built",
          user_id: identity.userId,
          tool_slug: toolSlug,
          tool_type: toolContextForEvents.toolType,
          context_lines: toolContextForEvents.contextLines,
          preferred_action: compactStrategy?.preferredAction ?? ""
        });
      }
      if (weightedToolContextForEvents) {
        await logContentEventServer({
          content_id: `${eid}-tool-weight`,
          event_type: "creator_state_tool_weighted",
          user_id: identity.userId,
          tool_slug: toolSlug,
          tool_type: toolContextForEvents?.toolType ?? "other",
          ranked_lines: weightedToolContextForEvents.rankedLines,
          top_line: weightedToolContextForEvents.topLine,
          weight_score: weightedToolContextForEvents.weightScore
        });
        await logContentEventServer({
          content_id: `${eid}-tool-band`,
          event_type: "creator_state_tool_band_classified",
          user_id: identity.userId,
          tool_slug: toolSlug,
          tool_type: toolContextForEvents?.toolType ?? "other",
          weight_score: weightedToolContextForEvents.weightScore,
          band: toolBandForEvents
        });
      }
      if (creatorStateForEvents) {
        await logContentEventServer({
          content_id: `${eid}-applied`,
          event_type: "creator_state_applied",
          user_id: identity.userId,
          tool_slug: toolSlug,
          stage: creatorStateForEvents.stage,
          priority: creatorStateForEvents.priority,
          focus: creatorStateForEvents.focus,
          problems_used: creatorStateForEvents.problems,
          actions_used: creatorStateForEvents.actions,
          strategy_used: creatorStateForEvents.strategy,
          summary: creatorStateForEvents.summary
        });
        await saveCreatorStateSnapshot(identity.userId, toolSlug, creatorStateForEvents);
      }
    }
    logAiTelemetry({
      task_type: "post_package",
      market,
      locale,
      provider: routerMeta.provider_used,
      model: routerMeta.model_used,
      user_plan: tier,
      latency_ms: Date.now() - started,
      model_latency_ms:
        modelParseOk || routerMeta.outcome === "heuristic_after_empty_parse" ? routerMeta.latency_ms : undefined,
      fallback_used: routerMeta.fallback_used,
      success: modelParseOk,
      user_fulfilled: true,
      outcome: routerMeta.outcome,
      error_class: routerMeta.error_class,
      route: clientRoute,
      error_code:
        !modelParseOk && routerMeta.error_class
          ? routerMeta.error_class
          : !modelParseOk
            ? "heuristic_fallback"
            : undefined,
      content_safety_filtered_count: safety.filteredCount,
      content_safety_risk_detected: safety.riskDetected,
      content_safety_profile: safety.profile,
      risk_score: risk.riskScore,
      risk_level: risk.riskLevel,
      rate_limited: false,
      blocked: false,
      abuse_reason: risk.reasons,
      dynamic_credit_cost: 0,
      global_guard: false,
      daily_limit_hit: false,
      anomaly_detected: risk.anomalyDetected,
      degraded
      ,
      model_tier: routerMeta.model_tier,
      estimated_cost_usd: routerMeta.estimated_cost_usd,
      max_tokens_applied: routerMeta.max_tokens_applied
    });
    return json;
  } catch (error) {
    console.error("generate-package error:", error);
    logAiTelemetry({
      task_type: "post_package",
      market: "unknown",
      locale: "unknown",
      provider: "none",
      model: "none",
      user_plan: "free",
      latency_ms: Date.now() - started,
      fallback_used: true,
      success: false,
      error_code: "unhandled"
    });
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}





