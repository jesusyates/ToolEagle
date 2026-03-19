/**
 * Client-side AI text generation.
 * Calls the /api/generate route. Falls back to template if AI fails.
 * Sends credentials so usage limits apply to logged-in users.
 */

export class LimitReachedError extends Error {
  constructor(
    message: string,
    public readonly used: number,
    public readonly limit: number
  ) {
    super(message);
    this.name = "LimitReachedError";
  }
}

export type GenerateOptions = { locale?: string };

export async function generateAIText(
  prompt: string,
  options?: GenerateOptions
): Promise<string[]> {
  const locale = options?.locale ?? "en";
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ prompt, locale })
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 429 && data.limitReached) {
      throw new LimitReachedError(
        data.error ?? "You've reached today's free limit.",
        data.used ?? 30,
        data.limit ?? 30
      );
    }
    throw new Error(data.error ?? "AI generation failed");
  }

  if (!data.results || !Array.isArray(data.results)) {
    throw new Error("Invalid AI response");
  }

  return data.results.slice(0, 5);
}
