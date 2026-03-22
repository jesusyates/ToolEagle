import type { AiProvider, ProviderGenerateInput, ProviderGenerateOutput, ProviderTextInput } from "./types";
import { fetchWithTimeout } from "./fetch-timeout";

function baseUrl(): string {
  const u = process.env.OPENAI_BASE_URL?.trim().replace(/\/$/, "");
  return u && u.length > 0 ? u : "https://api.openai.com/v1";
}

async function chatCompletion(
  providerId: string,
  input: ProviderGenerateInput
): Promise<ProviderGenerateOutput> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const url = `${baseUrl()}/chat/completions`;
  const body: Record<string, unknown> = {
    model: input.model,
    messages: [
      { role: "system", content: input.systemPrompt },
      { role: "user", content: input.userPrompt }
    ],
    temperature: input.temperature,
    max_tokens: input.maxTokens
  };
  if (input.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI HTTP ${response.status}: ${err.slice(0, 500)}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  const rawText = typeof content === "string" ? content : "";

  return { rawText, model: input.model, providerId };
}

export const openAiProvider: AiProvider = {
  id: "openai",

  async generatePackage(input: ProviderGenerateInput) {
    return chatCompletion("openai", input);
  },

  async healthCheck() {
    return Boolean(process.env.OPENAI_API_KEY?.trim());
  },

  normalizeOutput(raw: string) {
    let t = raw.trim();
    const fence = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(t);
    if (fence) t = fence[1].trim();
    return t;
  },

  async generateText(input: ProviderTextInput) {
    return chatCompletion("openai", { ...input, jsonMode: input.jsonMode ?? false });
  }
};
