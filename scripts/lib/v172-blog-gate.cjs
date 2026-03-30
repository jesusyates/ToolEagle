/**
 * V172 — Blog generator gates (mirrors src/lib/seo/v172-generation-gate.ts).
 */
const fs = require("fs");
const path = require("path");

function readJson(p) {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function normalizeTopic(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(s) {
  return new Set(normalizeTopic(s).split(" ").filter((w) => w.length > 2));
}

function jaccard(a, b) {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

function evaluatePregenBlog(userInput, cwd) {
  const h = readJson(path.join(cwd, "generated", "high-quality-signals.json"));
  if (!h) return { allowed: true, score: 0.5, reason: "no_signals_file" };
  const min = h.min_pregen_score ?? 0.08;
  let score = 0.22;
  const t = userInput.toLowerCase();
  const words = new Set(t.split(/\W+/).filter((w) => w.length > 3));
  let overlapBoost = 0;
  for (const s of (h.reference_snippets || []).slice(0, 48)) {
    const topic = String(s.topic || "").toLowerCase();
    const summary = String(s.summary || "").toLowerCase();
    if (topic && (t.includes(topic) || words.has(topic))) {
      overlapBoost += 0.08;
      continue;
    }
    let wHit = 0;
    for (const w of words) {
      if (w.length < 4) continue;
      if (topic.includes(w) || summary.includes(w)) wHit++;
    }
    overlapBoost += Math.min(0.07, wHit * 0.014);
  }
  score += Math.min(0.45, overlapBoost);
  for (const d of h.topic_demote || []) {
    const dl = String(d).toLowerCase().replace(/^\/+|\/+$/g, "");
    if (!dl) continue;
    if (t.includes(dl) || t.replace(/\//g, "").includes(dl.replace(/\//g, ""))) score -= 0.16;
  }
  score = Math.max(0, Math.min(1, score));
  if (score < min) return { allowed: false, score, reason: "below_pregen_threshold" };
  return { allowed: true, score, reason: "ok" };
}

function checkDedupBlog(userInput, cwd) {
  const doc = readJson(path.join(cwd, "generated", "content-deduplication.json"));
  const rows = doc?.titles;
  if (!rows?.length) return { blocked: false };
  const threshold = doc.title_similarity_threshold_blog ?? 0.55;
  const inputTokens = tokenSet(normalizeTopic(userInput));
  if (inputTokens.size === 0) return { blocked: false };
  for (const row of rows) {
    const sim = jaccard(inputTokens, tokenSet(row.normalized));
    if (sim >= threshold) return { blocked: true, similarSlug: row.slug, similarity: sim };
  }
  return { blocked: false };
}

function buildRetrievalRefBlog(userInput, cwd, topN = 5) {
  const h = readJson(path.join(cwd, "generated", "high-quality-signals.json"));
  let pool = h?.reference_snippets;
  if (!pool?.length) {
    const raw = readJson(path.join(cwd, "generated", "workflow-assets-retrieval.json"));
    const items = raw?.items ?? [];
    pool = items
      .slice()
      .sort((a, b) => (b.quality_score ?? 0) - (a.quality_score ?? 0))
      .slice(0, 28)
      .map((it) => ({
        topic: String(it.normalized_topic || it.topic || "").trim(),
        workflow: it.workflow,
        summary: String(it.content_summary || "").trim(),
        quality_score: Number(it.quality_score) || 0
      }))
      .filter((x) => x.topic || x.summary);
  }
  if (!pool.length) {
    return {
      block:
        "REFERENCE_SNIPPETS (V172): No retrieval rows yet. Still produce concrete list items and a full packageFraming (hook, captionOrTitle, cta, hashtags, whyItWorks).",
      snippetCount: 0
    };
  }
  const words = new Set(userInput.toLowerCase().split(/\W+/).filter((w) => w.length > 2));
  const scored = pool.map((s) => {
    let sc = s.quality_score ?? 0;
    const blob = `${s.topic} ${s.summary}`.toLowerCase();
    for (const w of words) {
      if (w.length > 3 && blob.includes(w)) sc += 0.11;
    }
    return { s, sc };
  });
  scored.sort((a, b) => b.sc - a.sc);
  const picks = scored.slice(0, topN).map((x) => x.s);
  const header =
    "REFERENCE_SNIPPETS (V172 — studio retrieval). Learn structure and specificity; do NOT copy verbatim:";
  const lines = picks.map(
    (s, i) => `${i + 1}. [${s.workflow || "studio"} · ${s.topic || "topic"}] ${s.summary || ""}`.trim()
  );
  return { block: `${header}\n${lines.join("\n")}`, snippetCount: picks.length };
}

module.exports = { evaluatePregenBlog, checkDedupBlog, buildRetrievalRefBlog };
