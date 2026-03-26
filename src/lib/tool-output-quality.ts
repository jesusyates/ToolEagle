/**
 * V109 — Behavioral output-quality signals (JSONL via API). No ratings UI.
 */

export type OutputResultType = "hook" | "caption" | "hashtags" | "full" | "script" | "block" | "cta" | "meta";

const PREFIX = "v109:tool:";

function sessionKey(slug: string, part: string) {
  return `${PREFIX}${slug}:${part}`;
}

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  const k = "v109:sessionId";
  let id = sessionStorage.getItem(k);
  if (!id) {
    id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `s-${Date.now()}`;
    sessionStorage.setItem(k, id);
  }
  return id;
}

/** Map URL slug heuristics → default block type for list tools (single-row copy). */
export function mapToolSlugToBlockResultType(slug: string): Exclude<OutputResultType, "full"> {
  const s = slug.toLowerCase();
  if (s.includes("hashtag")) return "hashtags";
  if (s.includes("hook")) return "hook";
  if (s.includes("caption")) return "caption";
  if (s.includes("title")) return "meta";
  return "block";
}

/** Index -1 = copy all; else per-row copy uses slug heuristic. */
export function mapListCopyToResultType(slug: string, index: number): OutputResultType {
  if (index < 0) return "full";
  return mapToolSlugToBlockResultType(slug);
}

/** Post-package field keys → coarse result types for block-level copies. */
export function mapPackageFieldKeyToResultType(key: string): OutputResultType {
  switch (key) {
    case "hook":
      return "hook";
    case "caption":
      return "caption";
    case "hashtags":
      return "hashtags";
    case "script_talking_points":
      return "script";
    case "cta_line":
      return "cta";
    case "topic":
    case "why_it_works":
    case "posting_tips":
    case "best_for":
    case "variation_pack":
    case "hook_strength_label":
    case "why_opening_grabs":
    case "why_structure_completion":
    case "why_copy_growth":
    case "context_account":
    case "context_scenario":
    case "context_audience":
    case "publish_rhythm":
    case "version_plain":
    case "version_optimized":
      return "meta";
    default:
      return "block";
  }
}

function post(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  fetch("/api/analytics/tool-output-quality", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).catch(() => {});
}

/** User copied output (button or delegated copy). */
export function logOutputCopy(toolSlug: string, resultType: OutputResultType) {
  post({
    type: "output_copy",
    toolSlug,
    resultType,
    sessionId: getOrCreateSessionId(),
    ts: new Date().toISOString()
  });
}

/**
 * Call once after a successful generation completes (template or AI).
 * Updates session generation count and logs for aggregation.
 */
export function recordGenerationComplete(toolSlug: string, opts: { wasRegenerate: boolean }) {
  if (typeof window === "undefined") return;
  const now = Date.now();
  const lastKey = sessionKey(toolSlug, "lastGenAt");
  const countKey = sessionKey(toolSlug, "genCount");
  const lastRaw = sessionStorage.getItem(lastKey);
  const prevCount = parseInt(sessionStorage.getItem(countKey) || "0", 10) || 0;
  const nextCount = prevCount + 1;
  sessionStorage.setItem(countKey, String(nextCount));
  sessionStorage.setItem(lastKey, String(now));

  const timeSinceLastMs =
    opts.wasRegenerate && lastRaw ? now - parseInt(lastRaw, 10) : null;

  post({
    type: "generation_complete",
    toolSlug,
    sessionId: getOrCreateSessionId(),
    generationCount: nextCount,
    wasRegenerate: opts.wasRegenerate,
    timeSinceLastMs,
    ts: new Date().toISOString()
  });
}
