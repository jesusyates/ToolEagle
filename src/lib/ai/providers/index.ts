import type { AiProvider } from "./types";
import { openAiProvider } from "./openai";
import { deepseekProvider } from "./deepseek";
import { qwenProvider } from "./qwen";
import type { CnProviderName } from "@/config/ai-router";

const registry: Record<string, AiProvider> = {
  openai: openAiProvider,
  deepseek: deepseekProvider,
  qwen: qwenProvider
};

export function getProviderById(id: string): AiProvider | null {
  return registry[id] ?? null;
}

export function getCnProvider(name: CnProviderName): AiProvider | null {
  if (name === "qwen") return qwenProvider;
  return deepseekProvider;
}

export { openAiProvider, deepseekProvider, qwenProvider };
export type { AiProvider, ProviderGenerateInput, ProviderGenerateOutput } from "./types";
