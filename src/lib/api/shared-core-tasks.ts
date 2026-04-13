"use client";

/**
 * Phase 2 — tasks / runs / results / history against shared-core-backend.
 * Request/response shapes are tolerant; align with OpenAPI when available.
 */

import { apiClient } from "@/lib/api/shared-core-client";
import { getSupabaseAccessToken } from "@/lib/auth/supabase-access-token";

const TERMINAL_RUN = new Set(["completed", "succeeded", "success", "done", "failed", "error", "cancelled"]);

function pickRecord(json: unknown): Record<string, unknown> | null {
  if (!json || typeof json !== "object") return null;
  return json as Record<string, unknown>;
}

function pickString(v: unknown): string | undefined {
  return typeof v === "string" && v ? v : undefined;
}

export function pickTaskId(json: unknown): string | null {
  const r = pickRecord(json);
  if (!r) return null;
  const data = r.data && typeof r.data === "object" ? (r.data as Record<string, unknown>) : null;
  return (
    pickString(r.id) ??
    pickString(r.taskId) ??
    pickString(r.task_id) ??
    (data ? pickString(data.id) ?? pickString(data.taskId) : null) ??
    null
  );
}

export function pickRunId(json: unknown): string | null {
  const r = pickRecord(json);
  if (!r) return null;
  const data = r.data && typeof r.data === "object" ? (r.data as Record<string, unknown>) : null;
  return (
    pickString(r.runId) ??
    pickString(r.run_id) ??
    pickString(r.id) ??
    (data ? pickString(data.runId) ?? pickString(data.run_id) ?? pickString(data.id) : null) ??
    null
  );
}

async function pollTaskRunUntilDone(accessToken: string, runId: string): Promise<{ ok: boolean }> {
  for (let i = 0; i < 90; i++) {
    const res = await apiClient.getTaskRun(accessToken, runId);
    if (!res.ok) return { ok: false };
    const j = await res.json().catch(() => null);
    const r = pickRecord(j);
    const data = r?.data && typeof r.data === "object" ? (r.data as Record<string, unknown>) : null;
    const st = (pickString(r?.status) ?? (data ? pickString(data.status) : undefined) ?? "").toLowerCase();
    if (st && TERMINAL_RUN.has(st)) {
      if (st === "failed" || st === "error" || st === "cancelled") return { ok: false };
      return { ok: true };
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  return { ok: false };
}

export type ToolGenerationPersistParams = {
  toolSlug: string;
  toolName: string;
  input: string;
  items: string[];
  market?: "cn" | "global";
};

/**
 * Primary path: create task → run → poll run → read result (shared-core).
 */
export async function persistToolGenerationToSharedCore(
  params: ToolGenerationPersistParams
): Promise<{ ok: boolean; error?: string }> {
  const accessToken = await getSupabaseAccessToken();
  if (!accessToken) return { ok: false, error: "unauthorized" };

  const body = {
    type: "web_tool_generation",
    toolSlug: params.toolSlug,
    toolName: params.toolName,
    input: params.input,
    items: params.items,
    market: params.market ?? "global"
  };

  const createRes = await apiClient.createTask(accessToken, body);
  if (!createRes.ok) {
    return { ok: false, error: `create_task_${createRes.status}` };
  }
  const created = await createRes.json().catch(() => null);
  const taskId = pickTaskId(created);
  if (!taskId) return { ok: false, error: "no_task_id" };

  const runRes = await apiClient.runTask(accessToken, taskId, {});
  if (!runRes.ok) {
    return { ok: false, error: `run_task_${runRes.status}` };
  }
  const runJson = await runRes.json().catch(() => null);
  const runId = pickRunId(runJson);
  if (!runId) return { ok: false, error: "no_run_id" };

  const polled = await pollTaskRunUntilDone(accessToken, runId);
  if (!polled.ok) return { ok: false, error: "run_poll_failed" };

  const resultRes = await apiClient.getResult(accessToken, runId);
  if (!resultRes.ok) {
    return { ok: false, error: `result_${resultRes.status}` };
  }

  return { ok: true };
}

export type HistoryRowUi = {
  id: string;
  toolSlug: string;
  toolName: string;
  input: string;
  items: string[];
  createdAt: number;
};

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function parseHistoryItem(raw: unknown): HistoryRowUi | null {
  const r = pickRecord(raw);
  if (!r) return null;
  const toolSlug =
    pickString(r.tool_slug) ?? pickString(r.toolSlug) ?? pickString(r.tool) ?? "";
  const toolName =
    pickString(r.tool_name) ?? pickString(r.toolName) ?? toolSlug;
  const input = pickString(r.input) ?? "";
  let items = asStringArray(r.items);
  if (items.length === 0 && r.output != null) {
    const o = r.output;
    if (Array.isArray(o)) items = asStringArray(o);
    else if (typeof o === "object" && o && Array.isArray((o as Record<string, unknown>).items)) {
      items = asStringArray((o as Record<string, unknown>).items);
    }
  }
  const createdRaw = r.created_at ?? r.createdAt ?? r.updated_at;
  const createdAt =
    typeof createdRaw === "string" || typeof createdRaw === "number"
      ? new Date(createdRaw).getTime()
      : Date.now();
  const id =
    pickString(r.id) ??
    pickString(r.run_id) ??
    pickString(r.runId) ??
    pickString(r.task_id) ??
    `h-${toolSlug || "row"}-${createdAt}`;
  if (!toolSlug && !input && items.length === 0) return null;
  return { id, toolSlug, toolName, input, items, createdAt };
}

/** GET /v1/history — tolerant list parse. */
export async function fetchSharedCoreHistory(): Promise<HistoryRowUi[]> {
  const accessToken = await getSupabaseAccessToken();
  if (!accessToken) return [];

  const res = await apiClient.getHistory(accessToken);
  if (!res.ok) return [];

  const json = await res.json().catch(() => null);
  const r = pickRecord(json);
  let list: unknown[] = [];
  if (Array.isArray(json)) list = json as unknown[];
  else if (Array.isArray(r?.items)) list = r!.items as unknown[];
  else if (Array.isArray(r?.history)) list = r!.history as unknown[];
  else if (Array.isArray(r?.data)) list = r!.data as unknown[];

  const rows: HistoryRowUi[] = [];
  for (const item of list) {
    const row = parseHistoryItem(item);
    if (row) rows.push(row);
  }
  return rows.sort((a, b) => b.createdAt - a.createdAt);
}
