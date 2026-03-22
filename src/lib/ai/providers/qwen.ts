import type { AiProvider, ProviderGenerateInput, ProviderGenerateOutput } from "./types";

/**
 * V98 — Scaffold for future Qwen / DashScope OpenAI-compatible endpoint.
 * Not active until DASHSCOPE_API_KEY (or QWEN_API_KEY) and base URL are wired.
 */
export const qwenProvider: AiProvider = {
  id: "qwen",

  async generatePackage(_input: ProviderGenerateInput): Promise<ProviderGenerateOutput> {
    throw new Error("Qwen provider not wired — set QWEN integration in a future release");
  },

  async healthCheck() {
    // Scaffold: flip to real key check once generatePackage calls DashScope.
    return false;
  },

  normalizeOutput(raw: string) {
    return raw.trim();
  }
};
