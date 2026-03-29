/**
 * V153 retrieval-first: load agent_high_quality_assets + workflow fallback, score by keyword overlap.
 * V166 — evaluateRetrievalForKeyword: explicit fallback reasons + bounded strong-workflow bias.
 */

const fs = require("fs");
const path = require("path");
const { isStrongWorkflow, applyBoundedBiasToThresholds } = require("./retrieval-threshold-bias.cjs");

const CWD = process.cwd();
const HQ_PATH = path.join(CWD, "generated", "agent_high_quality_assets.json");
const WF_PATH = path.join(CWD, "generated", "workflow-assets-retrieval.json");

/** V166 taxonomy for utilization summaries */
const FALLBACK_REASONS = [
  "dataset_not_ready",
  "workflow_bucket_empty",
  "no_qualified_hits",
  "score_below_threshold",
  "ai_forced_fallback"
];

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
    workflow_id: a.workflow_id || a.workflow || "",
    body: [a.content_summary, a.snippet, a.body, a.summary, a.text, a.content].filter(Boolean).join("\n"),
    tier: a.quality_tier || "high"
  }));
}

function workflowDatasetCount() {
  const raw = loadJson(WF_PATH, null);
  if (raw && typeof raw === "object" && typeof raw.item_count === "number") {
    return Math.max(0, Number(raw.item_count));
  }
  return normalizeAssetList(raw || { items: [] }).length;
}

function retrievalDatasetMinRows() {
  const n = parseInt(process.env.RETRIEVAL_DATASET_MIN_ROWS || "3", 10);
  return Number.isFinite(n) && n >= 1 ? n : 3;
}

function loadWorkflowAssets() {
  const raw = loadJson(WF_PATH, { items: [] });
  const items = normalizeAssetList(raw);
  return items.map((a, i) => ({
    id: a.id || `wf-${i}`,
    topic: a.topic || a.normalized_topic || "",
    workflow_id: a.workflow_id || a.workflow || "",
    body: [a.content_summary, a.snippet, a.body, a.summary, a.text].filter(Boolean).join("\n"),
    tier: Number(a.quality_score) >= 0.85 ? "high" : "workflow"
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

function passesScoreThresholds(hits, t1, t2a, t2b) {
  if (!hits || hits.length === 0) return false;
  const h0 = hits[0].score;
  const h1 = hits[1]?.score;
  if (hits.length >= 2 && h0 >= t2a && h1 >= t2b) return true;
  if (hits.length >= 1 && h0 >= t1) return true;
  return false;
}

/**
 * V166 — Full eligibility with fallback reason + optional bounded bias for strong workflows.
 * @param {{ keyword: string; platform?: string; goal?: string }} ctx
 */
function evaluateRetrievalForKeyword(ctx) {
  const keyword = ctx.keyword || "";
  const platform = ctx.platform || "";
  const goal = ctx.goal || "";

  if (process.env.SEO_FORCE_AI_GENERATION === "1") {
    return {
      hits: [],
      sufficient: false,
      fallbackReason: "ai_forced_fallback",
      primaryLane: null,
      topScore: null,
      thresholds: null,
      bias: { biasApplied: false, biasFactor: 1 }
    };
  }

  const minRows = retrievalDatasetMinRows();
  const dsCount = workflowDatasetCount();
  if (dsCount < minRows) {
    return {
      hits: [],
      sufficient: false,
      fallbackReason: "dataset_not_ready",
      primaryLane: null,
      topScore: null,
      thresholds: null,
      bias: { biasApplied: false, biasFactor: 1 }
    };
  }

  const { hits, primaryLane } = searchRetrievalForKeyword({ keyword, platform, goal });
  const wfItems = loadWorkflowAssets();

  if (hits.length === 0) {
    const reason =
      wfItems.length === 0 && dsCount >= minRows ? "workflow_bucket_empty" : "no_qualified_hits";
    return {
      hits,
      sufficient: false,
      fallbackReason: reason,
      primaryLane,
      topScore: null,
      thresholds: null,
      bias: { biasApplied: false, biasFactor: 1 }
    };
  }

  const ease = getRetrievalEaseMultiplier();
  let t2a = 0.12 / ease;
  let t2b = 0.08 / ease;
  let t1 = 0.35 / ease;

  const datasetReady = dsCount >= minRows;
  const strongWorkflow = isStrongWorkflow(platform, WF_PATH);
  const adj = applyBoundedBiasToThresholds(t1, t2a, t2b, { datasetReady, strongWorkflow });
  t1 = adj.t1;
  t2a = adj.t2a;
  t2b = adj.t2b;

  const sufficient = passesScoreThresholds(hits, t1, t2a, t2b);
  const topScore = hits[0]?.score ?? null;

  if (!sufficient) {
    return {
      hits,
      sufficient: false,
      fallbackReason: "score_below_threshold",
      primaryLane,
      topScore,
      thresholds: { t1, t2a, t2b },
      bias: { biasApplied: adj.biasApplied, biasFactor: adj.biasFactor }
    };
  }

  return {
    hits,
    sufficient: true,
    fallbackReason: null,
    primaryLane,
    topScore,
    thresholds: { t1, t2a, t2b },
    bias: { biasApplied: adj.biasApplied, biasFactor: adj.biasFactor }
  };
}

/** Legacy: score-only check without V166 bias (platform unknown). Prefer evaluateRetrievalForKeyword. */
function retrievalSufficient(hits) {
  if (workflowDatasetCount() < retrievalDatasetMinRows()) return false;
  if (!hits || hits.length === 0) return false;
  const ease = getRetrievalEaseMultiplier();
  const t2a = 0.12 / ease;
  const t2b = 0.08 / ease;
  const t1 = 0.35 / ease;
  return passesScoreThresholds(hits, t1, t2a, t2b);
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
  evaluateRetrievalForKeyword,
  retrievalSufficient,
  formatHitsForPrompt,
  loadHighQualityAssets,
  loadWorkflowAssets,
  workflowDatasetCount,
  retrievalDatasetMinRows,
  FALLBACK_REASONS,
  HQ_PATH,
  WF_PATH
};
