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
  const m = process.env.OPENAI_MODEL?.trim();
  return m && m.length > 0 ? m : "gpt-4o-mini";
}

export function getGeminiModel(): string {
  const m = process.env.GEMINI_MODEL?.trim();
  return m && m.length > 0 ? m : "gemini-2.5-flash";
}

/** Fixed default for EN guides cluster publish (rebuild-article). */
export const CLUSTER_PUBLISH_DEFAULT_MODEL = "gemini-2.5-flash" as const;

/**
 * Cluster SEO rebuild (`rebuild-article.ts`) — defaults to Gemini model.
 * Override: CLUSTER_PUBLISH_GEMINI_MODEL.
 */
export function getClusterPublishGeminiModel(): string {
  const m = process.env.CLUSTER_PUBLISH_GEMINI_MODEL?.trim();
  if (m && m.length > 0) return m;
  return getGeminiModel().trim() || CLUSTER_PUBLISH_DEFAULT_MODEL;
}

export function getDeepseekModel(): string {
  return process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat";
}
