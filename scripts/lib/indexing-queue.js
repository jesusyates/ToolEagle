/**
 * Node scripts (blog:generate, en:indexing:queue) load this file via plain `node`.
 * Implementation lives in `src/lib/indexing-queue.ts`; tsx compiles on the fly.
 */
const fs = require("fs");
const path = require("path");

const QUEUE_PATH = path.join(process.cwd(), "generated", "indexing-queue.json");
const LOG_PATH = path.join(process.cwd(), "logs", "indexing-submissions.jsonl");
const DEDUPE_MS = 7 * 24 * 60 * 60 * 1000;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadQueue() {
  try {
    if (!fs.existsSync(QUEUE_PATH)) return { pending: [], submittedAt: {} };
    const raw = fs.readFileSync(QUEUE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return {
      pending: Array.isArray(parsed.pending) ? parsed.pending : [],
      submittedAt: parsed.submittedAt && typeof parsed.submittedAt === "object" ? parsed.submittedAt : {}
    };
  } catch {
    return { pending: [], submittedAt: {} };
  }
}

function saveQueue(q) {
  ensureDir(path.dirname(QUEUE_PATH));
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(q, null, 2), "utf8");
}

function appendLogLine(obj) {
  ensureDir(path.dirname(LOG_PATH));
  fs.appendFileSync(LOG_PATH, `${JSON.stringify(obj)}\n`, "utf8");
}

function isRecentlySubmitted(submittedAt, url) {
  const t = submittedAt[url];
  if (!t) return false;
  const ts = new Date(t).getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < DEDUPE_MS;
}

function enqueueIndexingUrl(opts) {
  const url = typeof opts?.url === "string" ? opts.url.trim() : "";
  if (!url || !url.startsWith("http")) return { queued: false, reason: "invalid_url" };

  const q = loadQueue();
  if (isRecentlySubmitted(q.submittedAt, url)) return { queued: false, reason: "recently_submitted" };
  if (q.pending.some((p) => p && p.url === url)) return { queued: false, reason: "already_pending" };

  q.pending.push({
    url,
    source: opts?.source || "unknown",
    enqueuedAt: new Date().toISOString()
  });
  saveQueue(q);
  return { queued: true };
}

function recordSubmission(entry) {
  appendLogLine({
    at: entry?.at || new Date().toISOString(),
    url: entry?.url,
    source: entry?.source || "process",
    ok: !!entry?.ok,
    error: entry?.error || null
  });
  if (entry?.ok) {
    const q = loadQueue();
    q.submittedAt[entry.url] = entry.at || new Date().toISOString();
    saveQueue(q);
  }
}

function dequeueBatch(max = 20) {
  const q = loadQueue();
  const batch = q.pending.slice(0, max);
  q.pending = q.pending.slice(max);
  saveQueue(q);
  return batch;
}

function peekPendingCount() {
  return loadQueue().pending.length;
}

module.exports = {
  QUEUE_PATH,
  LOG_PATH,
  enqueueIndexingUrl,
  recordSubmission,
  dequeueBatch,
  peekPendingCount,
  loadQueue
};
