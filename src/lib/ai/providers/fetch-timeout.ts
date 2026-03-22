/**
 * V99 — Bounded fetch for AI providers (CN/Global stability).
 */
export function getAiChatTimeoutMs(): number {
  const n = parseInt(process.env.AI_CHAT_TIMEOUT_MS?.trim() || "", 10);
  if (Number.isFinite(n) && n >= 5000) return n;
  return 55_000;
}

export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = getAiChatTimeoutMs()
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}
