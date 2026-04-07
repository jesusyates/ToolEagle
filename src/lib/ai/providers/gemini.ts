import type { AiProvider, ProviderGenerateInput, ProviderGenerateOutput, ProviderTextInput } from "./types";
import { fetchWithTimeout } from "./fetch-timeout";

function modelFromInput(model: string): string {
  const m = model.trim();
  if (m.length > 0) return m;
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
}

async function generateViaGemini(input: ProviderGenerateInput | ProviderTextInput): Promise<ProviderGenerateOutput> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const model = modelFromInput(input.model);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const instruction = input.systemPrompt?.trim()
    ? `${input.systemPrompt}\n\n${input.userPrompt}`
    : input.userPrompt;

  const body: Record<string, unknown> = {
    contents: [
      {
        role: "user",
        parts: [{ text: instruction }]
      }
    ],
    generationConfig: {
      temperature: input.temperature,
      maxOutputTokens: input.maxTokens
    }
  };

  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("[gemini] providerAttempted=gemini providerFailed=gemini", `HTTP ${response.status}`, err.slice(0, 400));
    throw new Error(`Gemini HTTP ${response.status}: ${err.slice(0, 500)}`);
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    error?: { message?: string };
  };
  const rawText = data.candidates?.[0]?.content?.parts?.map((p) => p?.text ?? "").join("") ?? "";
  if (!rawText.trim()) {
    const payload = JSON.stringify(data).slice(0, 800);
    console.error(
      "[gemini] providerAttempted=gemini providerFailed=gemini responseEmpty=true",
      data.error?.message ?? payload
    );
    throw new Error(
      `Gemini returned empty text (blocked, no candidates, or API error). ${data.error?.message ?? payload.slice(0, 200)}`
    );
  }
  console.info(
    "[gemini] providerAttempted=gemini providerFailed=none responseEmpty=false chars=",
    rawText.length
  );
  return { rawText, model, providerId: "gemini" };
}

export const geminiProvider: AiProvider = {
  id: "gemini",

  async generatePackage(input: ProviderGenerateInput) {
    return generateViaGemini(input);
  },

  async healthCheck() {
    return Boolean(process.env.GEMINI_API_KEY?.trim());
  },

  normalizeOutput(raw: string) {
    let t = raw.trim();
    const fence = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(t);
    if (fence) t = fence[1].trim();
    return t;
  },

  async generateText(input: ProviderTextInput) {
    return generateViaGemini(input);
  }
};
