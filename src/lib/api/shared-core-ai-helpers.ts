/** Tolerant parsing for POST /v1/ai/execute responses (Phase 3). */

const RESULT_SEPARATOR = "\n---\n";

export function parseSimpleTextToResultList(text: string): string[] {
  const raw = text.trim();
  if (!raw) return [];

  const parts = raw.split(RESULT_SEPARATOR).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 3) return parts.slice(0, 5);

  const fallback = raw.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  if (fallback.length >= 3) return fallback.slice(0, 5);

  const lines = raw.split("\n").map((p) => p.trim()).filter((p) => p.length > 5);
  if (lines.length >= 3) return lines.slice(0, 5);

  return raw ? [raw] : [];
}

export function parseSimpleExecuteResults(data: unknown): string[] | null {
  if (!data || typeof data !== "object") return null;
  const r = data as Record<string, unknown>;
  const nested =
    r.data && typeof r.data === "object" ? (r.data as Record<string, unknown>) : null;
  const rawResults = (nested?.results ?? r.results) as unknown;
  if (Array.isArray(rawResults) && rawResults.every((x) => typeof x === "string")) {
    return rawResults.slice(0, 5);
  }
  const text =
    (typeof r.text === "string" && r.text) ||
    (typeof r.output === "string" && r.output) ||
    (nested && typeof nested.text === "string" && nested.text) ||
    (nested && typeof nested.output === "string" && nested.output) ||
    "";
  if (text) return parseSimpleTextToResultList(text);
  return null;
}

export function unwrapPackageExecuteResponse(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Record<string, unknown>;
  if (Array.isArray(r.packages)) return r;
  const data = r.data;
  if (data && typeof data === "object" && Array.isArray((data as Record<string, unknown>).packages)) {
    return data as Record<string, unknown>;
  }
  return r;
}
