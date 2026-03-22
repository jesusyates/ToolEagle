/**
 * V99 — Structured error classification for telemetry and generationMeta.
 */

export type AiErrorClass = "timeout" | "http_4xx" | "http_5xx" | "unavailable" | "network" | "unknown";

export function classifyProviderError(err: unknown): AiErrorClass {
  if (err instanceof Error) {
    const name = err.name;
    const msg = err.message;
    if (name === "AbortError" || /aborted|timeout/i.test(msg)) return "timeout";
    if (/HTTP 4\d\d/.test(msg)) return "http_4xx";
    if (/HTTP 5\d\d/.test(msg)) return "http_5xx";
    if (/unavailable|not configured/i.test(msg)) return "unavailable";
    if (/fetch failed|ECONNRESET|ENOTFOUND|network/i.test(msg)) return "network";
  }
  return "unknown";
}
