/**
 * Client-side AI text generation.
 * Calls the /api/generate route. Falls back to template if AI fails.
 * Sends credentials so usage limits apply to logged-in users.
 */

import { FREE_DAILY_LIMIT } from "@/lib/usage";
import { readV195ChainSessionId } from "@/lib/tiktok-chain-tracking";

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
  options?: GenerateOptions & { toolSlug?: string }
): Promise<{ results: string[]; content_id: string }> {
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
        data.used ?? FREE_DAILY_LIMIT,
        data.limit ?? FREE_DAILY_LIMIT
      );
    }
    throw new Error(data.error ?? "AI generation failed");
  }

  if (!data.results || !Array.isArray(data.results)) {
    throw new Error("Invalid AI response");
  }

  const results = data.results.slice(0, 5);

  const content_id =
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `c-${Date.now()}-${Math.random()}`;

  // V196 — non-blocking content_items write (best-effort).
  try {
    const toolSlug = options?.toolSlug ?? "";
    const tool_type =
      toolSlug === "hook-generator"
        ? "hook"
        : toolSlug === "tiktok-caption-generator"
          ? "caption"
          : toolSlug === "hashtag-generator"
            ? "hashtag"
            : toolSlug === "title-generator"
              ? "title"
              : null;

    if (tool_type) {
      const anonKey = "te_v187_anon_id";
      const anonymous_id =
        (typeof window !== "undefined" && localStorage.getItem(anonKey)) || `anon-${Date.now()}`;
      const chain_session_id = readV195ChainSessionId();

      void fetch("/api/content-memory/content-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_id,
          anonymous_id,
          tool_type,
          platform: "tiktok",
          input_text: prompt,
          generated_output: results,
          chain_session_id
        })
      }).catch(() => {});
    }
  } catch {
    // ignore
  }

  return { results, content_id };
}
