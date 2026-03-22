/**
 * V98 — Regional AI router feature flags (Global primary, CN as extension).
 * CN provider is gated until explicitly enabled in production.
 */

export type CnProviderName = "deepseek" | "qwen";

/** When "1" or "true", CN market may use regional provider (if keys configured). */
export function isCnProviderEnabled(): boolean {
  const v = process.env.ENABLE_CN_PROVIDER?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/** Which regional backend to prefer for CN when enabled. */
export function getCnProviderName(): CnProviderName {
  const v = (process.env.CN_PROVIDER || "deepseek").trim().toLowerCase();
  if (v === "qwen") return "qwen";
  return "deepseek";
}

export function getOpenAiModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

export function getDeepseekModel(): string {
  return process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat";
}
