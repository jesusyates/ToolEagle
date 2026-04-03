/**
 * V106: File-based indexing queue for Google Indexing API batching.
 * Shared by Next.js API routes and Node scripts (via scripts/lib/indexing-queue.js + tsx).
 */

import fs from "fs";
import path from "path";

export const QUEUE_PATH = path.join(process.cwd(), "generated", "indexing-queue.json");
export const LOG_PATH = path.join(process.cwd(), "logs", "indexing-submissions.jsonl");

const DEDUPE_MS = 7 * 24 * 60 * 60 * 1000;

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

type QueueState = {
  pending: { url: string; source?: string; enqueuedAt?: string }[];
  submittedAt: Record<string, string>;
};

export function loadQueue(): QueueState {
  try {
    if (!fs.existsSync(QUEUE_PATH)) {
      return { pending: [], submittedAt: {} };
    }
    const raw = fs.readFileSync(QUEUE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      pending: Array.isArray(parsed.pending) ? (parsed.pending as QueueState["pending"]) : [],
      submittedAt:
        parsed.submittedAt && typeof parsed.submittedAt === "object"
          ? (parsed.submittedAt as Record<string, string>)
          : {}
    };
  } catch {
    return { pending: [], submittedAt: {} };
  }
}

function saveQueue(q: QueueState) {
  ensureDir(path.dirname(QUEUE_PATH));
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(q, null, 2), "utf8");
}

function appendLogLine(obj: Record<string, unknown>) {
  ensureDir(path.dirname(LOG_PATH));
  fs.appendFileSync(LOG_PATH, `${JSON.stringify(obj)}\n`, "utf8");
}

function isRecentlySubmitted(submittedAt: Record<string, string>, url: string) {
  const t = submittedAt[url];
  if (!t) return false;
  const ts = new Date(t).getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < DEDUPE_MS;
}

export function enqueueIndexingUrl(opts: { url?: string; source?: string }) {
  if (process.env.SEO_DRY_RUN === "1" || process.env.SEO_SANDBOX === "1") {
    return { queued: false, reason: "dry_run_skipped" as const };
  }
  const url = typeof opts?.url === "string" ? opts.url.trim() : "";
  if (!url || !url.startsWith("http")) return { queued: false, reason: "invalid_url" as const };

  const q = loadQueue();
  if (isRecentlySubmitted(q.submittedAt, url)) {
    return { queued: false, reason: "recently_submitted" as const };
  }
  if (q.pending.some((p) => p && p.url === url)) {
    return { queued: false, reason: "already_pending" as const };
  }

  q.pending.push({
    url,
    source: opts.source || "unknown",
    enqueuedAt: new Date().toISOString()
  });
  saveQueue(q);
  return { queued: true as const };
}

export function recordSubmission(entry: {
  url: string;
  source?: string;
  ok: boolean;
  error?: string;
  at?: string;
}) {
  appendLogLine({
    at: entry.at || new Date().toISOString(),
    url: entry.url,
    source: entry.source || "process",
    ok: entry.ok,
    error: entry.error || null
  });
  if (entry.ok) {
    const q = loadQueue();
    q.submittedAt[entry.url] = entry.at || new Date().toISOString();
    saveQueue(q);
  }
}

export function dequeueBatch(max = 20) {
  const q = loadQueue();
  const batch = q.pending.slice(0, max);
  q.pending = q.pending.slice(max);
  saveQueue(q);
  return batch;
}

export function peekPendingCount() {
  const q = loadQueue();
  return q.pending.length;
}
