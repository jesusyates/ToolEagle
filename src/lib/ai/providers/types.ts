/**
 * V98 — Swappable AI providers; business code depends on this contract only.
 */

export type ProviderGenerateInput = {
  systemPrompt: string;
  userPrompt: string;
  model: string;
  maxTokens: number;
  temperature: number;
  /** When true, request JSON object response if the API supports it */
  jsonMode: boolean;
};

export type ProviderGenerateOutput = {
  rawText: string;
  model: string;
  providerId: string;
};

/**
 * Optional text generation (scaffold for future non-package tasks).
 */
export type ProviderTextInput = Omit<ProviderGenerateInput, "jsonMode"> & { jsonMode?: boolean };

export interface AiProvider {
  readonly id: string;

  generatePackage(input: ProviderGenerateInput): Promise<ProviderGenerateOutput>;

  /** Simple availability check (e.g. API key present). */
  healthCheck(): Promise<boolean>;

  /**
   * Normalize provider-specific quirks before shared JSON parse.
   * Default: strip markdown fences if any.
   */
  normalizeOutput(raw: string): string;

  /** Optional generic completion; not required for post-package path. */
  generateText?(input: ProviderTextInput): Promise<ProviderGenerateOutput>;
}
