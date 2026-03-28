/**
 * V153 retrieval-first: load agent_high_quality_assets + workflow fallback, score by keyword overlap.
 */

const fs = require("fs");
const path = require("path");

const CWD = process.cwd();
const HQ_PATH = path.join(CWD, "generated", "agent_high_quality_assets.json");
const WF_PATH = path.join(CWD, "generated", "workflow-assets-retrieval.json");
function riskContextJsonPath() {
  const sandbox = path.join(CWD, "generated", "sandbox", "seo-risk-context.json");
  if (process.env.SEO_DRY_RUN === "1" || process.env.SEO_SANDBOX === "1") {
    try {
      if (fs.existsSync(sandbox)) return sandbox;
    } catch {
      // fall through
    }
  }
  return path.join(CWD, "generated", "seo-risk-context.json");
}

function loadJson(p, fallback) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
}

function tokenize(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function scoreOverlap(queryTokens, text) {
  const tset = new Set(tokenize(text));
  if (tset.size === 0 || queryTokens.length === 0) return 0;
  let hit = 0;
  for (const q of queryTokens) {
    if (tset.has(q)) hit++;
  }
  return hit / Math.max(queryTokens.length, 1);
}

function normalizeAssetList(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw && Array.isArray(raw.items)) return raw.items;
  if (raw && Array.isArray(raw.assets)) return raw.assets;
  return [];
}

function loadHighQualityAssets() {
  const raw = loadJson(HQ_PATH, []);
  return normalizeAssetList(raw).map((a, i) => ({
    id: a.id || a.asset_id || `hq-${i}`,
    topic: a.topic || a.normalized_topic || "",
    workflow_id: a.workflow_id || "",
    body: [a.snippet, a.body, a.summary, a.text, a.content].filter(Boolean).join("\n"),
    tier: a.quality_tier || "high"
  }));
}

function loadWorkflowAssets() {
  const raw = loadJson(WF_PATH, { items: [] });
  return normalizeAssetList(raw).map((a, i) => ({
    id: a.id || `wf-${i}`,
    topic: a.topic || a.normalized_topic || "",
    workflow_id: a.workflow_id || "",
    body: [a.snippet, a.body, a.summary, a.text].filter(Boolean).join("\n"),
    tier: "workflow"
  }));
}

/**
 * Search HQ first, then workflow assets. Returns ranked hits with scores 0..1.
 */
function searchRetrievalForKeyword({ keyword, platform, goal }) {
  const queryTokens = tokenize([keyword, platform, goal].filter(Boolean).join(" "));
  const hq = loadHighQualityAssets();
  const wf = loadWorkflowAssets();

  const scoreAsset = (a) => {
    const text = `${a.topic}\n${a.body}`;
    return scoreOverlap(queryTokens, text);
  };

  const ranked = [];
  for (const a of hq) {
    const score = scoreAsset(a);
    if (score > 0.05) ranked.push({ ...a, score, lane: "agent_high_quality_assets" });
  }
  ranked.sort((x, y) => y.score - x.score);

  if (ranked.length >= 2) return { hits: ranked.slice(0, 8), primaryLane: "agent_high_quality_assets" };

  const wfRanked = [];
  for (const a of wf) {
    const score = scoreAsset(a);
    if (score > 0.05) wfRanked.push({ ...a, score, lane: "workflow_assets" });
  }
  wfRanked.sort((x, y) => y.score - x.score);

  const merged = [...ranked, ...wfRanked].sort((x, y) => y.score - x.score);
  return { hits: merged.slice(0, 8), primaryLane: ranked.length ? "agent_high_quality_assets" : "workflow_assets" };
}

/** V156 — relax score bar when search risk recommends retrieval-first (multiplier ≥1). */
function getRetrievalEaseMultiplier() {
  try {
    const j = loadJson(riskContextJsonPath(), {});
    const m = Number(j.retrieval_ease_multiplier);
    if (!Number.isFinite(m)) return 1;
    return Math.min(1.35, Math.max(1, m));
  } catch {
    return 1;
  }
}

/** Sufficient for retrieval-rewrite path (target 60–80% over time via growing HQ corpus). */
function retrievalSufficient(hits) {
  if (!hits || hits.length === 0) return false;
  const ease = getRetrievalEaseMultiplier();
  const t2a = 0.12 / ease;
  const t2b = 0.08 / ease;
  const t1 = 0.35 / ease;
  if (hits.length >= 2 && hits[0].score >= t2a && hits[1].score >= t2b) return true;
  if (hits.length >= 1 && hits[0].score >= t1) return true;
  return false;
}

function formatHitsForPrompt(hits, maxChars = 6000) {
  let out = "";
  for (const h of hits.slice(0, 5)) {
    const block = `[${h.lane} id=${h.id} topic=${h.topic}]\n${String(h.body || "").slice(0, 1200)}\n\n`;
    if (out.length + block.length > maxChars) break;
    out += block;
  }
  return out.trim();
}

module.exports = {
  searchRetrievalForKeyword,
  retrievalSufficient,
  formatHitsForPrompt,
  loadHighQualityAssets,
  loadWorkflowAssets,
  HQ_PATH,
  WF_PATH
};
