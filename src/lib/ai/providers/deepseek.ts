import type { AiProvider, ProviderGenerateInput, ProviderGenerateOutput } from "./types";
import { fetchWithTimeout } from "./fetch-timeout";

function baseUrl(): string {
  const u = process.env.DEEPSEEK_BASE_URL?.trim().replace(/\/$/, "");
  return u && u.length > 0 ? u : "https://api.deepseek.com/v1";
}

/**
 * DeepSeek Chat API — OpenAI-compatible chat completions.
 * @see https://api-docs.deepseek.com/
 */
export const deepseekProvider: AiProvider = {
  id: "deepseek",

  async generatePackage(input: ProviderGenerateInput): Promise<ProviderGenerateOutput> {
    const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
    if (!apiKey) {
      throw new Error("DEEPSEEK_API_KEY not configured");
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
      throw new Error(`DeepSeek HTTP ${response.status}: ${err.slice(0, 500)}`);
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    const rawText = typeof content === "string" ? content : "";

    return { rawText, model: input.model, providerId: "deepseek" };
  },

  async healthCheck() {
    return Boolean(process.env.DEEPSEEK_API_KEY?.trim());
  },

  normalizeOutput(raw: string) {
    let t = raw.trim();
    const fence = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(t);
    if (fence) t = fence[1].trim();
    return t;
  }
};
