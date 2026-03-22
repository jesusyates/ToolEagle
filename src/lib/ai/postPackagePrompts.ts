import type { PostPackageToolKind } from "@/lib/ai/postPackage";
import { composePostPackagePrompts } from "@/lib/ai/prompts/composePostPackage";

/**
 * @deprecated Prefer composePostPackagePrompts + router for system+user split.
 * Returns user prompt only (legacy callers).
 */
export function buildPostPackagePrompt(
  userInput: string,
  toolKind: PostPackageToolKind,
  tier: "free" | "pro",
  options?: { market?: "global" | "cn"; locale?: string }
): string {
  return composePostPackagePrompts({
    userInput,
    toolKind,
    tier,
    market: options?.market ?? "global",
    locale: options?.locale ?? "en"
  }).userPrompt;
}

export { JSON_RULES, buildBaseUserInstruction } from "@/lib/ai/prompts/shared/json-rules";
