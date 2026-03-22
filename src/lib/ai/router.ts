/**
 * V98 — Regional AI router: Global-primary, CN as extension.
 * Chooses provider chain, composes layered prompts, handles fallback, returns normalized text + meta.
 */

import type { PostPackageToolKind } from "@/lib/ai/postPackage";
import {
  getCnProviderName,
  getDeepseekModel,
  getOpenAiModel,
  isCnProviderEnabled
} from "@/config/ai-router";
import { getProviderById } from "@/lib/ai/providers";
import { composePostPackagePrompts, type ComposedMarket } from "@/lib/ai/prompts/composePostPackage";
import type { AiErrorClass } from "@/lib/ai/ai-error-classify";

export type RoutedMarket = ComposedMarket;

export type AiTaskType = "post_package";

export type PostPackageRouterContext = {
  market: RoutedMarket;
  locale: string;
  toolType: PostPackageToolKind;
  userPlan: "free" | "pro";
  taskType: AiTaskType;
  /** V106.1 — merged publish-ready single pack */
  publishFullPack?: boolean;
};

/** V99 — How the response was produced (telemetry + generationMeta). */
export type GenerationOutcome =
  | "model_primary"
  | "model_after_provider_fallback"
  | "heuristic_after_empty_parse"
  | "heuristic_after_router_failure";

export type GenerationRouterMeta = {
  provider_used: string;
  model_used: string;
  fallback_used: boolean;
  latency_ms: number;
  outcome?: GenerationOutcome;
  /** Set when router exhausts providers without a successful completion */
  error_class?: AiErrorClass;
  /** Client pathname for CN perf / diagnostics (set in API route) */
  route?: string;
};

type Attempt = { providerId: string; model: string };

function buildAttemptChain(market: RoutedMarket): Attempt[] {
  const openaiModel = getOpenAiModel();
  const primaryGlobal: Attempt[] = [{ providerId: "openai", model: openaiModel }];

  if (market !== "cn") {
    return primaryGlobal;
  }

  if (!isCnProviderEnabled()) {
    return primaryGlobal;
  }

  const name = getCnProviderName();
  if (name === "deepseek") {
    return [
      { providerId: "deepseek", model: getDeepseekModel() },
      { providerId: "openai", model: openaiModel }
    ];
  }

  // Qwen provider is scaffold-only until DashScope/OpenAPI is wired — keep global primary path.
  return primaryGlobal;
}

export type RouterGeneratePostPackageInput = PostPackageRouterContext & {
  userInput: string;
};

/**
 * Runs provider chain with layered prompts; returns JSON text ready for parsePackagesJson.
 */
export async function routerGeneratePostPackage(
  input: RouterGeneratePostPackageInput
): Promise<{ rawText: string; meta: GenerationRouterMeta }> {
  const attempts = buildAttemptChain(input.market);
  const { systemPrompt, userPrompt } = composePostPackagePrompts({
    userInput: input.userInput,
    toolKind: input.toolType,
    tier: input.userPlan,
    market: input.market,
    locale: input.locale,
    publishFullPack: input.publishFullPack
  });

  /** V103.1 — Pro: larger output for 8–12 packages */
  const maxTokens = input.userPlan === "pro" ? 8000 : 3400;
  const temperature = 0.75;

  const t0 = Date.now();
  let lastError: Error | null = null;
  let attemptIndex = 0;

  for (const attempt of attempts) {
    const resolved = getProviderById(attempt.providerId);
    if (!resolved) {
      lastError = new Error(`Unknown provider: ${attempt.providerId}`);
      attemptIndex++;
      continue;
    }

    const healthy = await resolved.healthCheck();
    if (!healthy) {
      lastError = new Error(`Provider unavailable: ${attempt.providerId}`);
      attemptIndex++;
      continue;
    }

    try {
      const out = await resolved.generatePackage({
        systemPrompt,
        userPrompt,
        model: attempt.model,
        maxTokens,
        temperature,
        jsonMode: true
      });

      const normalized = resolved.normalizeOutput(out.rawText);
      const latency_ms = Date.now() - t0;
      const fallback_used = attemptIndex > 0;
      const outcome: GenerationOutcome = fallback_used
        ? "model_after_provider_fallback"
        : "model_primary";

      return {
        rawText: normalized,
        meta: {
          provider_used: out.providerId,
          model_used: out.model,
          fallback_used,
          latency_ms,
          outcome
        }
      };
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      attemptIndex++;
    }
  }

  throw lastError ?? new Error("All AI providers failed");
}
