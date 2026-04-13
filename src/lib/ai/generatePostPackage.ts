/**
 * V95: Client → shared-core POST /v1/ai/execute (kind: post_package) via `webAiExecute`.
 * Legacy `app/api/generate-package` remains for server rollback — not used by this client path.
 */

import { FREE_DAILY_LIMIT } from "@/lib/usage";
import type { CreatorPostPackage, PostPackageToolKind } from "@/lib/ai/postPackage";
import type { LockedPackagePreview } from "@/lib/ai/packageTierSplit";
import { LimitReachedError } from "@/lib/ai/generateText";
import type { PlatformId } from "@/lib/platform-intelligence/resolve-patterns";
import { readV195ChainSessionId } from "@/lib/tiktok-chain-tracking";
import { unwrapPackageExecuteResponse, webAiExecute } from "@/lib/web/web-ai-client";
import { getSupabaseAccessToken } from "@/lib/auth/supabase-access-token";

export { LimitReachedError };

export type PackageGenerationMeta = {
  provider_used: string;
  model_used: string;
  fallback_used: boolean;
  latency_ms: number;
  /** V99 — see GenerationOutcome in router */
  outcome?: string;
  error_class?: string;
  route?: string;
};

export type SupporterResponseMeta = {
  level: string;
  earlyFeatureAccess: boolean;
  effectiveFreeLimit: number;
};

export type ContentSafetyClientMeta = {
  applied: boolean;
  profile: string;
  filteredCount: number;
  riskDetected: number;
};

export class CreditsDepletedError extends Error {
  constructor(
    message: string,
    public readonly required: number,
    public readonly remaining: number
  ) {
    super(message);
    this.name = "CreditsDepletedError";
  }
}

export type GeneratePackageResult = {
  /** V196 — stable identifier for this generated content chain (used by content_events). */
  content_id: string;
  packages: CreatorPostPackage[];
  /** V96: Free tier — blurred Pro slots */
  lockedPreview?: LockedPackagePreview[];
  tierApplied: "free" | "pro";
  resultQuality: "compact_post_package" | "full_post_package";
  /** V98: Router telemetry — optional for UI/debug */
  generationMeta?: PackageGenerationMeta;
  /** V100.1 — free tier supporter perks echo */
  supporterMeta?: SupporterResponseMeta;
  /** V104 — content safety pass echo */
  contentSafety?: ContentSafetyClientMeta;
  /** V106.1 — server echoed for UI banner */
  publishFullPack?: boolean;
  /** V107 — after deduct */
  creditsRemaining?: number;
  creditsUsed?: number;
  /** V193.1 — server confirms TikTok observation conditioning */
  v193ObservationApplied?: boolean;
  /** V193.4 — same-chain consistency applied for TikTok chain tools */
  v193ChainConsistencyApplied?: boolean;
};

export async function generatePostPackages(
  userInput: string,
  toolKind: PostPackageToolKind,
  options?: {
    locale?: string;
    market?: "global" | "cn";
    clientRoute?: string;
    publishFullPack?: boolean;
    /** Actual tool page slug (e.g. tiktok-caption-generator) for attribution / V186 */
    toolSlug?: string;
    /** V186 Creator Knowledge Engine · V191 platform + monetization hints */
    v186?: {
      toolSlug: string;
      intentId: string;
      scenarioId: string;
      platform?: PlatformId;
      monetizationMode?: string;
      primaryGoal?: "views" | "followers" | "sales";
    };
    /** V191 — pre-built text block from Creator Analysis (optional) */
    creatorAnalysisSummary?: string;
    attribution?: {
      entry_source?: string | null;
      entry_intent?: string | null;
      topic?: string | null;
      workflow?: string | null;
    };
  }
): Promise<GeneratePackageResult> {
  const locale = options?.locale ?? "en";
  const body: Record<string, unknown> = { userInput, toolKind, locale };
  if (options?.market) {
    body.market = options.market;
  }
  if (options?.clientRoute) {
    body.clientRoute = options.clientRoute;
  }
  if (typeof options?.publishFullPack === "boolean") {
    body.publishFullPack = options.publishFullPack;
  }
  if (options?.attribution && typeof options.attribution === "object") {
    body.entrySource = options.attribution.entry_source ?? null;
    body.entryIntent = options.attribution.entry_intent ?? null;
    body.entryTopic = options.attribution.topic ?? null;
    body.entryWorkflow = options.attribution.workflow ?? null;
  }
  body.toolSlug = options?.toolSlug ?? toolKind;
  if (options?.v186) {
    body.v186 = options.v186;
  }
  if (typeof options?.creatorAnalysisSummary === "string" && options.creatorAnalysisSummary.trim().length > 0) {
    body.creatorAnalysisSummary = options.creatorAnalysisSummary.trim().slice(0, 2400);
  }
  const accessToken = await getSupabaseAccessToken();
  const res = await webAiExecute(accessToken, {
    kind: "post_package",
    ...body
  });

  const rawJson = await res.json().catch(() => ({}));
  const data = unwrapPackageExecuteResponse(rawJson) as Record<string, unknown>;

  if (!res.ok) {
    if (res.status === 429 && data.limitReached) {
      throw new LimitReachedError(
        (data.error as string) ?? "Limit reached",
        (data.used as number) ?? FREE_DAILY_LIMIT,
        (data.limit as number) ?? FREE_DAILY_LIMIT
      );
    }
    if (res.status === 402 && data.limitReached && data.error === "insufficient_credits") {
      throw new CreditsDepletedError(
        (data.error as string) ?? "insufficient_credits",
        typeof data.required === "number" ? data.required : 1,
        typeof data.remaining === "number" ? data.remaining : 0
      );
    }
    throw new Error((data.error as string) ?? "Package generation failed");
  }

  if (!data.packages || !Array.isArray(data.packages)) {
    throw new Error("Invalid package response");
  }

  const genMeta = data.generationMeta;
  const generationMeta =
    genMeta &&
    typeof genMeta === "object" &&
    typeof (genMeta as PackageGenerationMeta).provider_used === "string"
      ? (genMeta as PackageGenerationMeta)
      : undefined;

  const sm = data.supporterMeta;
  const supporterMeta =
    sm &&
    typeof sm === "object" &&
    typeof (sm as SupporterResponseMeta).level === "string" &&
    typeof (sm as SupporterResponseMeta).effectiveFreeLimit === "number"
      ? (sm as SupporterResponseMeta)
      : undefined;

  const cs = data.contentSafety;
  const contentSafety =
    cs &&
    typeof cs === "object" &&
    typeof (cs as ContentSafetyClientMeta).profile === "string" &&
    typeof (cs as ContentSafetyClientMeta).filteredCount === "number" &&
    typeof (cs as ContentSafetyClientMeta).riskDetected === "number"
      ? (cs as ContentSafetyClientMeta)
      : undefined;

  const v193 = data.v193 as { observation_applied?: boolean; chain_consistency_applied?: boolean } | undefined;

  const content_id =
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `c-${Date.now()}-${Math.random()}`;

  // V196 — non-blocking content_items write (must not impact UX).
  try {
    const toolSlug = String(options?.toolSlug ?? toolKind);
    const tool_type =
      toolSlug === "hook-generator"
        ? "hook"
        : toolSlug === "tiktok-caption-generator"
          ? "caption"
          : toolSlug === "hashtag-generator"
            ? "hashtag"
            : toolSlug === "title-generator"
              ? "title"
              : null;

    if (tool_type) {
      const anonKey = "te_v187_anon_id";
      const anonymous_id =
        (typeof window !== "undefined" && localStorage.getItem(anonKey)) || `anon-${Date.now()}`;
      const chain_session_id = readV195ChainSessionId();

      // Fire-and-forget insert; wrap in try/catch so generation remains uninterrupted.
      void fetch("/api/content-memory/content-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_id,
          anonymous_id,
          tool_type,
          platform: "tiktok",
          input_text: userInput,
          generated_output: data.packages,
          chain_session_id
        })
      }).catch(() => {});
    }
  } catch {
    // ignore
  }

  return {
    content_id,
    packages: data.packages as CreatorPostPackage[],
    lockedPreview: Array.isArray(data.lockedPreview)
      ? (data.lockedPreview as LockedPackagePreview[])
      : undefined,
    tierApplied: data.tierApplied === "pro" ? "pro" : "free",
    resultQuality:
      data.resultQuality === "full_post_package" ? "full_post_package" : "compact_post_package",
    generationMeta,
    supporterMeta,
    contentSafety,
    publishFullPack: data.publishFullPack === true,
    creditsRemaining: typeof data.creditsRemaining === "number" ? data.creditsRemaining : undefined,
    creditsUsed: typeof data.creditsUsed === "number" ? data.creditsUsed : undefined,
    v193ObservationApplied: v193?.observation_applied === true,
    v193ChainConsistencyApplied: v193?.chain_consistency_applied === true
  };
}
