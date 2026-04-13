/**
 * Client-side AI text generation.
 * Primary: shared-core POST /v1/ai/execute (`webAiExecute`). Template fallback if AI response is unusable.
 * Legacy `app/api/generate` exists for server-side rollback only — not used by this client path.
 */

import { FREE_DAILY_LIMIT } from "@/lib/usage";
import { readV195ChainSessionId } from "@/lib/tiktok-chain-tracking";
import { parseSimpleExecuteResults, webAiExecute } from "@/lib/web/web-ai-client";
import { getSupabaseAccessToken } from "@/lib/auth/supabase-access-token";

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
  const accessToken = await getSupabaseAccessToken();

  const res = await webAiExecute(accessToken, {
    kind: "simple_text",
    prompt,
    locale,
    toolSlug: options?.toolSlug ?? null
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 429 && (data as { limitReached?: boolean }).limitReached) {
      const d = data as { error?: string; used?: number; limit?: number };
      throw new LimitReachedError(
        d.error ?? "You've reached today's free limit.",
        d.used ?? FREE_DAILY_LIMIT,
        d.limit ?? FREE_DAILY_LIMIT
      );
    }
    throw new Error((data as { error?: string }).error ?? "AI generation failed");
  }

  const parsed = parseSimpleExecuteResults(data);
  if (!parsed || parsed.length === 0) {
    throw new Error("Invalid AI response");
  }

  const results = parsed.slice(0, 5);

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
