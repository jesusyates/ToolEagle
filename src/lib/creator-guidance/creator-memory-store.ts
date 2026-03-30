/**
 * V187 — Client-side Creator Memory (per browser). Server sync can be added later.
 */

import { emitTikTokChainUploadRedirect } from "@/lib/tiktok-chain-tracking";

const MEMORY_KEY = "te_v187_creator_memory";
const ANON_KEY = "te_v187_anon_id";
const MAX_EVENTS = 60;

export type CreatorPublishEventV187 = {
  ts: number;
  type: "upload_redirect";
  platform?: string;
};

export type CreatorMemoryV187 = {
  version: 2;
  anonymous_id: string;
  user_id: string | null;
  platform: "tiktok" | "mixed" | "unknown";
  niche_hints: string[];
  tool_usage_history: { tool_slug: string; ts: number; journey_step?: number }[];
  generation_history: { tool_slug: string; ts: number; input_preview: string }[];
  copy_events: { tool_slug: string; result_type: string; ts: number }[];
  /** V189 — clicks from Ready-to-post modal toward platform upload */
  publish_events: CreatorPublishEventV187[];
  preferred_content_type: string | null;
  last_v186_intent_id: string | null;
  last_v186_scenario_id: string | null;
  /** V189 — distinct intent ids observed (capped) */
  v186_intent_ids_seen?: string[];
  /** V191 — last time user saved Creator Analysis (optional small V189 bonus) */
  v191_analysis_completed_at: number | null;
  last_updated: number;
};

function newMemory(anon: string): CreatorMemoryV187 {
  return {
    version: 2,
    anonymous_id: anon,
    user_id: null,
    platform: "unknown",
    niche_hints: [],
    tool_usage_history: [],
    generation_history: [],
    copy_events: [],
    publish_events: [],
    preferred_content_type: null,
    last_v186_intent_id: null,
    last_v186_scenario_id: null,
    v186_intent_ids_seen: [],
    v191_analysis_completed_at: null,
    last_updated: Date.now()
  };
}

export function getOrCreateAnonymousId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = localStorage.getItem(ANON_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    return `anon-${Date.now()}`;
  }
}

export function loadCreatorMemory(): CreatorMemoryV187 {
  if (typeof window === "undefined") return newMemory("ssr");
  try {
    const anon = getOrCreateAnonymousId();
    const raw = localStorage.getItem(MEMORY_KEY);
    if (!raw) return newMemory(anon);
    const p = JSON.parse(raw) as Partial<CreatorMemoryV187>;
    if (p.version !== 2 || typeof p.anonymous_id !== "string") {
      return newMemory(anon);
    }
    const pubRaw = Array.isArray(p.publish_events) ? p.publish_events : [];
    const publish_events: CreatorPublishEventV187[] = pubRaw
      .filter((e): e is CreatorPublishEventV187 =>
        Boolean(e && typeof e === "object" && typeof (e as CreatorPublishEventV187).ts === "number")
      )
      .map((e) => ({
        ts: e.ts,
        type: (e as CreatorPublishEventV187).type === "upload_redirect" ? "upload_redirect" : "upload_redirect",
        platform: typeof (e as { platform?: string }).platform === "string" ? (e as { platform?: string }).platform : undefined
      }));
    const intentSeen = Array.isArray(p.v186_intent_ids_seen)
      ? (p.v186_intent_ids_seen as string[]).filter((x) => typeof x === "string")
      : [];

    return {
      ...newMemory(anon),
      ...p,
      anonymous_id: p.anonymous_id || anon,
      tool_usage_history: Array.isArray(p.tool_usage_history) ? p.tool_usage_history : [],
      generation_history: Array.isArray(p.generation_history) ? p.generation_history : [],
      copy_events: Array.isArray(p.copy_events) ? p.copy_events : [],
      publish_events,
      niche_hints: Array.isArray(p.niche_hints) ? p.niche_hints : [],
      v186_intent_ids_seen: intentSeen,
      v191_analysis_completed_at:
        typeof p.v191_analysis_completed_at === "number" ? p.v191_analysis_completed_at : null
    };
  } catch {
    return newMemory(getOrCreateAnonymousId());
  }
}

function save(m: CreatorMemoryV187) {
  if (typeof window === "undefined") return;
  try {
    m.last_updated = Date.now();
    localStorage.setItem(MEMORY_KEY, JSON.stringify(m));
    window.dispatchEvent(new Event("te_v187_memory_updated"));
  } catch {
    /* quota */
  }
}

function trim<T>(arr: T[]): T[] {
  return arr.slice(-MAX_EVENTS);
}

function inferPlatformFromSlug(slug: string): CreatorMemoryV187["platform"] {
  const s = slug.toLowerCase();
  if (s.includes("tiktok") || s.includes("douyin")) return "tiktok";
  if (s.includes("youtube") || s.includes("instagram") || s.includes("reel")) return "mixed";
  return "mixed";
}

function extractNicheHints(text: string, existing: string[]): string[] {
  const t = text.toLowerCase().replace(/[^\w\s#]/g, " ");
  const words = t.split(/\s+/).filter((w) => w.length > 3 && w.length < 24);
  const stop = new Set(["your", "this", "that", "with", "from", "have", "will", "about", "video", "content"]);
  const scored = words.filter((w) => !stop.has(w));
  const next = [...new Set([...scored.slice(0, 5), ...existing])].slice(0, 12);
  return next;
}

/** Call after successful generation (from recordGenerationComplete). */
export function recordV187GenerationEvent(
  toolSlug: string,
  opts: { wasRegenerate: boolean; inputPreview?: string }
) {
  if (typeof window === "undefined") return;
  const m = loadCreatorMemory();
  m.platform = inferPlatformFromSlug(toolSlug);
  const preview = (opts.inputPreview ?? "").trim().slice(0, 200);
  m.generation_history = trim([
    ...m.generation_history,
    { tool_slug: toolSlug, ts: Date.now(), input_preview: preview || "(promptless or chips)" }
  ]);
  if (preview.length > 8) {
    m.niche_hints = extractNicheHints(preview, m.niche_hints);
  }
  m.tool_usage_history = trim([
    ...m.tool_usage_history,
    { tool_slug: toolSlug, ts: Date.now() }
  ]);
  save(m);
}

/** Call when user copies output (from logOutputCopy). */
export function recordV187CopyEvent(toolSlug: string, resultType: string) {
  if (typeof window === "undefined") return;
  const m = loadCreatorMemory();
  m.copy_events = trim([
    ...m.copy_events,
    { tool_slug: toolSlug, result_type: resultType, ts: Date.now() }
  ]);
  const map: Record<string, string> = {
    hook: "hook",
    caption: "caption",
    hashtags: "hashtags",
    meta: "titles",
    script: "script",
    full: "package",
    block: "block",
    cta: "cta"
  };
  m.preferred_content_type = map[resultType] ?? resultType;
  save(m);
}

export function recordV187V186Context(intentId: string | null, scenarioId: string | null) {
  if (typeof window === "undefined") return;
  const m = loadCreatorMemory();
  if (intentId) {
    m.last_v186_intent_id = intentId;
    const prev = m.v186_intent_ids_seen ?? [];
    const next = new Set([...prev, intentId]);
    m.v186_intent_ids_seen = Array.from(next).slice(-16);
  }
  if (scenarioId) m.last_v186_scenario_id = scenarioId;
  save(m);
}

/** V189 — User opened platform upload from Ready-to-post modal */
export function recordV187PublishRedirectClick(opts?: { platform?: string; toolSlug?: string }) {
  if (typeof window === "undefined") return;
  const m = loadCreatorMemory();
  m.publish_events = trim([
    ...m.publish_events,
    { ts: Date.now(), type: "upload_redirect", platform: opts?.platform }
  ]);
  save(m);
  emitTikTokChainUploadRedirect(opts?.toolSlug);
}

export function setCreatorMemoryUserId(userId: string | null) {
  if (typeof window === "undefined") return;
  const m = loadCreatorMemory();
  m.user_id = userId;
  save(m);
}

/** V191 — merge account-analysis keywords into niche hints for V187/V186 context */
export function mergeV191AnalysisIntoMemory(opts: { nicheKeywords: string[]; preferredContentTypeHint?: string | null }) {
  if (typeof window === "undefined") return;
  const m = loadCreatorMemory();
  m.niche_hints = [...new Set([...opts.nicheKeywords, ...m.niche_hints])].slice(0, 14);
  if (opts.preferredContentTypeHint) {
    m.preferred_content_type = opts.preferredContentTypeHint;
  }
  m.v191_analysis_completed_at = Date.now();
  save(m);
}
