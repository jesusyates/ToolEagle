/**
 * V95: Client → /api/generate-package (structured post packages).
 */

import { FREE_DAILY_LIMIT } from "@/lib/usage";
import type { CreatorPostPackage, PostPackageToolKind } from "@/lib/ai/postPackage";
import type { LockedPackagePreview } from "@/lib/ai/packageTierSplit";
import { LimitReachedError } from "@/lib/ai/generateText";

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
};

export async function generatePostPackages(
  userInput: string,
  toolKind: PostPackageToolKind,
  options?: {
    locale?: string;
    market?: "global" | "cn";
    clientRoute?: string;
    publishFullPack?: boolean;
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
  body.toolSlug = toolKind;
  const res = await fetch("/api/generate-package", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body)
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 429 && data.limitReached) {
      throw new LimitReachedError(
        data.error ?? "Limit reached",
        data.used ?? FREE_DAILY_LIMIT,
        data.limit ?? FREE_DAILY_LIMIT
      );
    }
    if (res.status === 402 && data.limitReached && data.error === "insufficient_credits") {
      throw new CreditsDepletedError(
        data.error ?? "insufficient_credits",
        typeof data.required === "number" ? data.required : 1,
        typeof data.remaining === "number" ? data.remaining : 0
      );
    }
    throw new Error(data.error ?? "Package generation failed");
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

  return {
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
    creditsUsed: typeof data.creditsUsed === "number" ? data.creditsUsed : undefined
  };
}
