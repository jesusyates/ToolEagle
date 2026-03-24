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

function sanitizeClientRoute(s: unknown): string | undefined {
  if (typeof s !== "string") return undefined;
  const t = s.trim().slice(0, 200);
  if (!t.startsWith("/")) return undefined;
  if (/[\n\r\0]/.test(t)) return undefined;
  return t;
}

/** V104.2 — Douyin tool URLs on /zh (caption · hook · script · V105.1 growth tools). */
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

function fallbackPackages(userInput: string, tier: "free" | "pro"): CreatorPostPackage[] {
  const short = userInput.trim().slice(0, 120) || "your video topic";
  const hooks = [
    `You need to see this 👇 ${short}`,
    `POV: nobody talks about ${short} like this`,
    `Stop scrolling — ${short} in 15 seconds`,
    `If you create content about ${short}, this changes the game`,
    `Nobody tells you this about ${short} — quick take:`,
    `3 seconds to hook you on ${short}`,
    `The ${short} hack nobody shares`,
    `Why ${short} matters in 2024`,
    `Real talk about ${short}`,
    `${short} — beginner to pro`
  ];
  const n = tier === "pro" ? 10 : 5;
  const out: CreatorPostPackage[] = [];
  for (let i = 0; i < n; i++) {
    const packs = ["Emotional", "Sales", "Educational", "Entertainment"] as const;
    const strengths = ["Strong hook", "Medium hook", "Safe hook"] as const;
    out.push(
      emptyPackage({
        topic: short,
        hook: hooks[i % hooks.length],
        script_talking_points: `• Open with pattern interrupt\n• Show proof or demo\n• Land the takeaway`,
        caption: `${hooks[i % hooks.length]}\n\n${short}\n\n✨ Save this.`,
        cta_line: "Follow for part 2 · comment your niche",
        hashtags: "#fyp #creators #contentcreator #learnontiktok",
        why_it_works: "One-line: curiosity + clarity + a reason to follow.",
        posting_tips:
          "Post when your audience is awake · Pin a comment with a link · Reply in first 30 min",
        best_for: "Creators shipping daily short-form who need a fast skeleton to riff on.",
        variation_pack: packs[i % 4],
        hook_strength_label: strengths[i % 3],
        why_opening_grabs: "Pattern-interrupt in line 1 increases scroll-stops.",
        why_structure_completion: "Three-beat flow keeps attention through the payoff.",
        why_copy_growth: "Clear CTA + niche hashtags help saves and profile visits.",
        context_account: "New creators and growth-focused accounts",
        context_scenario: "Short tips / story / demo formats",
        context_audience: "General short-form viewers in your niche",
        publish_rhythm: "0–2s hook · 2–12s proof/story · 12–18s CTA",
        version_plain: `${hooks[i % hooks.length]} — straight take on ${short}.`,
        version_optimized: `${hooks[i % hooks.length]} — tighter promise + clearer proof + stronger CTA on ${short}.`
      })
    );
  }
  return out.filter((p) => packageBlockCount(p) >= 5);
}

/** V103.1 — Pro: 10 packages; Free: 5 (for locked previews) */
function padToMin(
  packages: CreatorPostPackage[],
  userInput: string,
  tier: "free" | "pro"
): CreatorPostPackage[] {
  const min = tier === "pro" ? 10 : 5;
  const fb = fallbackPackages(userInput, tier);
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
    const userInput = typeof reqBody.userInput === "string" ? reqBody.userInput : "";
    const locale = typeof reqBody.locale === "string" ? reqBody.locale : "en";
    const toolKind = (typeof reqBody.toolKind === "string" ? reqBody.toolKind : "tiktok_caption") as PostPackageToolKind;
    const clientRoute = sanitizeClientRoute(reqBody.clientRoute);
    const market = resolveSafetyMarket(request, {
      market: typeof reqBody.market === "string" ? reqBody.market : undefined,
      locale
    }) as RoutedMarket;

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

    let packages: CreatorPostPackage[] = [];
    let modelParseOk = false;

    try {
      const result = await routerGeneratePostPackage({
        userInput,
        toolType: toolKind,
        userPlan: tier,
        market,
        locale,
        taskType: "post_package",
        publishFullPack,
        riskScore: risk.riskScore
      });
      routerMeta = { ...result.meta, route: clientRoute };
      packages = typeof result.rawText === "string" ? parsePackagesJson(result.rawText) : [];
      modelParseOk = packages.length > 0;
    } catch (err) {
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
    }

    if (packages.length === 0) {
      packages = fallbackPackages(userInput, tier);
      const wasRouterFailure = routerMeta.provider_used === "none";
      routerMeta = {
        ...routerMeta,
        provider_used: wasRouterFailure ? "local_heuristic" : routerMeta.provider_used,
        fallback_used: true,
        outcome: wasRouterFailure ? "heuristic_after_router_failure" : "heuristic_after_empty_parse"
      };
    }

    packages = padToMin(packages, userInput, tier);

    const safety = applyContentSafetyToPackages(packages, market === "cn" ? "cn" : "global");
    packages = safety.packages;

    routerMeta = { ...routerMeta, route: clientRoute };

    const extraVisible = gate.supporterPerks.freeVisibleExtraSlots;
    const douyinTool = market === "cn" && isDouyinToolRoute(clientRoute);
    /** V102.2 — CN free: 2 base visible; V104.2 — Douyin: 1 visible + richer locked previews */
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
      return NextResponse.json(payload);
    }

    const json = NextResponse.json(payload);
    await finalizeGenerationUsage(gate, json);
    await incrementDailyUsage(identity, 1);
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
