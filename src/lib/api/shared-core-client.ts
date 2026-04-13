/**
 * Phase 1 — shared-core-backend HTTP client (Web).
 * Base URL configurable via NEXT_PUBLIC_SHARED_CORE_URL (default: ops IP).
 */

import { getSupabaseAccessToken } from "@/lib/auth/supabase-access-token";

const DEFAULT_SHARED_CORE_BASE = "http://43.160.229.50:4000";

export function getSharedCoreBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_SHARED_CORE_URL;
  if (typeof env === "string" && env.trim()) return env.replace(/\/$/, "");
  return DEFAULT_SHARED_CORE_BASE;
}

export type SharedCoreRequestOptions = RequestInit & {
  /**
   * Bearer for shared-core. When omitted (undefined), browser resolves via getSupabaseAccessToken().
   * Pass explicit empty / null only when you rely on that resolution path; server has no session.
   */
  accessToken?: string | null;
};

function clientPlatformHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    "X-Client-Platform": "web",
    "X-Client-Product": "aics"
  };
  if (typeof window !== "undefined") {
    const path = window.location?.pathname ?? "";
    if (path === "/zh" || path.startsWith("/zh/")) {
      h["X-Client-Market"] = "cn";
      h["X-Client-Locale"] = "zh";
    } else {
      h["X-Client-Market"] = "global";
      h["X-Client-Locale"] = "en";
    }
    if (typeof process.env.NEXT_PUBLIC_APP_VERSION === "string" && process.env.NEXT_PUBLIC_APP_VERSION) {
      h["X-Client-Version"] = process.env.NEXT_PUBLIC_APP_VERSION;
    }
  }
  return h;
}

async function resolveBearer(accessToken: string | null | undefined): Promise<string | null> {
  if (typeof accessToken === "string" && accessToken.trim().length > 0) {
    return accessToken.trim();
  }
  if (typeof window === "undefined") return null;
  try {
    return await getSupabaseAccessToken();
  } catch {
    return null;
  }
}

export async function sharedCoreFetch(
  path: string,
  options: SharedCoreRequestOptions = {}
): Promise<Response> {
  const { accessToken, headers: initHeaders, ...rest } = options;
  const url = `${getSharedCoreBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(initHeaders);
  headers.set("Accept", "application/json");
  for (const [k, v] of Object.entries(clientPlatformHeaders())) {
    if (!headers.has(k)) headers.set(k, v);
  }
  const bearer = await resolveBearer(accessToken);
  if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    console.log("[auth-token] token length:", bearer ? bearer.length : 0);
  }
  if (bearer) {
    headers.set("Authorization", `Bearer ${bearer}`);
  }
  return fetch(url, { ...rest, headers });
}

export async function sharedCoreHealth(): Promise<Response> {
  return sharedCoreFetch("/health", { method: "GET" });
}

export async function sharedCoreGetSession(accessToken: string): Promise<Response> {
  return sharedCoreFetch("/v1/account/session", { method: "GET", accessToken });
}

export async function sharedCoreGetEntitlements(accessToken: string): Promise<Response> {
  return sharedCoreFetch("/v1/account/entitlements", { method: "GET", accessToken });
}

/** Phase 4 — usage ledger / summary (Web read path). */
export async function sharedCoreGetUsage(accessToken: string, query?: Record<string, string>): Promise<Response> {
  const q = query ? `?${new URLSearchParams(query).toString()}` : "";
  return sharedCoreFetch(`/v1/usage${q}`, { method: "GET", accessToken });
}

/** Phase 4 — quota summary (Web read path). */
export async function sharedCoreGetQuota(accessToken: string): Promise<Response> {
  return sharedCoreFetch("/v1/quota", { method: "GET", accessToken });
}

export async function sharedCoreCreateTask(accessToken: string, body: unknown): Promise<Response> {
  return sharedCoreFetch("/v1/tasks", {
    method: "POST",
    accessToken,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

export async function sharedCoreRunTask(accessToken: string, taskId: string, body: unknown): Promise<Response> {
  const id = encodeURIComponent(taskId);
  return sharedCoreFetch(`/v1/tasks/${id}/run`, {
    method: "POST",
    accessToken,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {})
  });
}

export async function sharedCoreGetTaskRun(accessToken: string, runId: string): Promise<Response> {
  const id = encodeURIComponent(runId);
  return sharedCoreFetch(`/v1/task-runs/${id}`, { method: "GET", accessToken });
}

export async function sharedCoreGetResult(accessToken: string, runId: string): Promise<Response> {
  const id = encodeURIComponent(runId);
  return sharedCoreFetch(`/v1/results/${id}`, { method: "GET", accessToken });
}

export async function sharedCoreGetHistory(accessToken: string, query?: Record<string, string>): Promise<Response> {
  const q = query ? `?${new URLSearchParams(query).toString()}` : "";
  return sharedCoreFetch(`/v1/history${q}`, { method: "GET", accessToken });
}

/** Phase 3 — AI execute (Bearer optional for anonymous if core allows). */
export async function sharedCoreAiExecute(
  accessToken: string | null,
  body: unknown
): Promise<Response> {
  return sharedCoreFetch("/v1/ai/execute", {
    method: "POST",
    accessToken: accessToken ?? undefined,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

/** Optional router preview — no current Web caller; exposed for parity with API. */
export async function sharedCoreAiRouterPreview(
  accessToken: string | null,
  body: unknown
): Promise<Response> {
  return sharedCoreFetch("/v1/ai/router/preview", {
    method: "POST",
    accessToken: accessToken ?? undefined,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

/** Unified client for shared-core-backend (Phase 1 + 2 + 3). */
export const apiClient = {
  get baseUrl() {
    return getSharedCoreBaseUrl();
  },
  fetch: sharedCoreFetch,
  health: sharedCoreHealth,
  getAccountSession: sharedCoreGetSession,
  getAccountEntitlements: sharedCoreGetEntitlements,
  getUsage: sharedCoreGetUsage,
  getQuota: sharedCoreGetQuota,
  createTask: sharedCoreCreateTask,
  runTask: sharedCoreRunTask,
  getTaskRun: sharedCoreGetTaskRun,
  getResult: sharedCoreGetResult,
  getHistory: sharedCoreGetHistory,
  aiExecute: sharedCoreAiExecute,
  aiRouterPreview: sharedCoreAiRouterPreview
} as const;
