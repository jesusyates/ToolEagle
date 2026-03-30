/**
 * V195 — TikTok four-tool chain session + server-side JSONL telemetry (no UI).
 */

const LS_KEY = "te_v195_chain_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const LAST_CONTENT_ID_BY_TOOL_KEY = "te_v195_last_content_id_by_tool";

export const TIKTOK_CHAIN_TOOL_SLUGS = [
  "hook-generator",
  "tiktok-caption-generator",
  "hashtag-generator",
  "title-generator"
] as const;

export type TikTokChainToolSlug = (typeof TIKTOK_CHAIN_TOOL_SLUGS)[number];

export type V195ChainSessionState = {
  chain_session_id: string;
  start_tool: string;
  start_timestamp: number;
  /** True after upload_redirect when chain is considered closed for this attempt */
  completed?: boolean;
};

export function isTikTokChainToolSlug(slug: string): slug is TikTokChainToolSlug {
  return (TIKTOK_CHAIN_TOOL_SLUGS as readonly string[]).includes(slug);
}

function readState(): V195ChainSessionState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<V195ChainSessionState>;
    if (
      typeof p.chain_session_id !== "string" ||
      typeof p.start_tool !== "string" ||
      typeof p.start_timestamp !== "number"
    ) {
      return null;
    }
    return {
      chain_session_id: p.chain_session_id,
      start_tool: p.start_tool,
      start_timestamp: p.start_timestamp,
      completed: p.completed === true
    };
  } catch {
    return null;
  }
}

function writeState(s: V195ChainSessionState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch {
    /* quota */
  }
}

function getAnonId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    const k = "te_v187_anon_id";
    let id = localStorage.getItem(k);
    if (!id && typeof crypto !== "undefined" && crypto.randomUUID) {
      id = crypto.randomUUID();
      localStorage.setItem(k, id);
    }
    return id || `anon-${Date.now()}`;
  } catch {
    return `anon-${Date.now()}`;
  }
}

function post(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  fetch("/api/analytics/tiktok-chain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).catch(() => {});
}

type LastContentIdByTool = Record<string, string>;

function readLastContentIdMap(): LastContentIdByTool {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LAST_CONTENT_ID_BY_TOOL_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as Partial<LastContentIdByTool>;
    const out: LastContentIdByTool = {};
    for (const [k, v] of Object.entries(p || {})) {
      if (typeof v === "string" && v.trim()) out[String(k)] = v.trim();
    }
    return out;
  } catch {
    return {};
  }
}

function writeLastContentIdMap(map: LastContentIdByTool) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LAST_CONTENT_ID_BY_TOOL_KEY, JSON.stringify(map));
  } catch {
    /* quota */
  }
}

function storeLastContentIdForTool(toolSlug: string, contentId?: string) {
  if (!contentId || typeof contentId !== "string") return;
  const id = contentId.trim();
  if (!id) return;
  const map = readLastContentIdMap();
  map[toolSlug] = id;
  writeLastContentIdMap(map);
}

export function readV195ChainSessionId(): string | null {
  const s = readState();
  return s?.chain_session_id ?? null;
}

function readLastContentIdForTool(toolSlug: string): string | null {
  const map = readLastContentIdMap();
  return map[toolSlug] ?? null;
}

async function postContentEvent(eventType: "generate" | "copy" | "upload_redirect", contentId: string) {
  // Non-blocking telemetry; never throw to user flow.
  try {
    await fetch("/api/content-memory/content-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content_id: contentId,
        event_type: eventType
      })
    });
  } catch {
    // ignore
  }
}

function shouldStartFresh(prev: V195ChainSessionState | null): boolean {
  if (!prev) return true;
  if (prev.completed) return true;
  if (Date.now() - prev.start_timestamp > SESSION_TTL_MS) return true;
  return false;
}

/**
 * Call on mount of any TikTok chain tool page so session_start fires before first generate when possible.
 */
export function initTikTokChainSessionOnTool(toolSlug: string) {
  if (!isTikTokChainToolSlug(toolSlug)) return;
  const prev = readState();
  if (!shouldStartFresh(prev)) return;
  const chain_session_id =
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `ch-${Date.now()}`;
  const start_timestamp = Date.now();
  const next: V195ChainSessionState = {
    chain_session_id,
    start_tool: toolSlug,
    start_timestamp,
    completed: false
  };
  writeState(next);
  post({
    type: "session_start",
    chain_session_id,
    anonymous_id: getAnonId(),
    start_tool: toolSlug,
    start_timestamp,
    timestamp: start_timestamp
  });
}

function ensureSessionForEvent(toolSlug: string): V195ChainSessionState | null {
  if (!isTikTokChainToolSlug(toolSlug)) return null;
  let prev = readState();
  if (shouldStartFresh(prev)) {
    initTikTokChainSessionOnTool(toolSlug);
    prev = readState();
  }
  return prev;
}

function mapGenerationEvent(toolSlug: string): string | null {
  switch (toolSlug) {
    case "hook-generator":
      return "hook_generated";
    case "tiktok-caption-generator":
      return "caption_generated";
    case "hashtag-generator":
      return "hashtag_generated";
    case "title-generator":
      return "title_generated";
    default:
      return null;
  }
}

export function emitTikTokChainGenerationIfApplicable(toolSlug: string, contentId?: string) {
  const ev = mapGenerationEvent(toolSlug);
  if (!ev) return;
  const session = ensureSessionForEvent(toolSlug);
  if (!session) return;
  storeLastContentIdForTool(toolSlug, contentId);
  const timestamp = Date.now();
  post({
    type: "step",
    chain_session_id: session.chain_session_id,
    tool_slug: toolSlug,
    event: ev,
    timestamp,
    anonymous_id: getAnonId()
  });
}

export function emitTikTokChainCopyIfApplicable(toolSlug: string) {
  if (!isTikTokChainToolSlug(toolSlug)) return;
  const session = ensureSessionForEvent(toolSlug);
  if (!session) return;
  const timestamp = Date.now();
  post({
    type: "step",
    chain_session_id: session.chain_session_id,
    tool_slug: toolSlug,
    event: "copy_event",
    timestamp,
    anonymous_id: getAnonId()
  });
}

/**
 * Called when user opens platform upload from Ready-to-post (pairs with V187 publish_events).
 * `toolSlug` should be the page/tool where the modal was opened (hook, caption, hashtag, or title).
 */
export function emitTikTokChainUploadRedirect(toolSlugParam?: string) {
  const slug =
    toolSlugParam && isTikTokChainToolSlug(toolSlugParam) ? toolSlugParam : "title-generator";
  let session = readState();
  if (!session) {
    initTikTokChainSessionOnTool(slug);
    session = readState();
  }
  if (!session || session.completed) return;
  const timestamp = Date.now();
  const lastContentId = readLastContentIdForTool(slug);
  if (lastContentId) void postContentEvent("upload_redirect", lastContentId);
  post({
    type: "step",
    chain_session_id: session.chain_session_id,
    tool_slug: slug,
    event: "upload_redirect",
    timestamp,
    anonymous_id: getAnonId()
  });
  writeState({ ...session, completed: true });
}
