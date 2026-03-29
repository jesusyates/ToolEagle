/**
 * V153 retrieval-first: load agent_high_quality_assets + workflow fallback, score by keyword overlap.
 * V166 — evaluateRetrievalForKeyword: explicit fallback reasons + bounded strong-workflow bias.
 * V166.1 — CJK / substring / goal-anchor matching (bounded) + activation pass when signals exist.
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

/** V166.1 — second-pass thresholds (multiply = easier pass), bounded single step */
const ACTIVATION_THRESHOLD_MULT = 0.87;
const ACTIVATION_MIN_TOP_SCORE = 0.13;
const ACTIVATION_MIN_SIGNAL_EXPANDED = 0.08;
const ACTIVATION_MIN_SIGNAL_BASE = 0.07;
const MIN_HIT_SCORE = 0.055;

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

function normalizePhrase(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function cjkChars(s) {
  const out = new Set();
  for (const ch of String(s || "")) {
    if (/[\u4e00-\u9fff]/.test(ch)) out.add(ch);
  }
  return out;
}

function longestCommonSubstringLength(a, b) {
  a = String(a).slice(0, 100);
  b = String(b).slice(0, 100);
  const m = a.length;
  const n = b.length;
  let best = 0;
  const dp = Array(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    let prev = 0;
    for (let j = 1; j <= n; j++) {
      const cur = a[i - 1] === b[j - 1] ? prev + 1 : 0;
      prev = dp[j];
      dp[j] = cur;
      if (cur > best) best = cur;
    }
  }
  return best;
}

/**
 * Bounded substring / shared-substring score (V166.1). No credit below minLen.
 */
function scoreSubstringOverlap(qn, tn) {
  if (!qn || !tn) return 0;
  const minLen = 4;
  if (qn.length < minLen && tn.length < minLen) return 0;
  if (tn.includes(qn) && qn.length >= minLen) {
    return Math.min(0.58, 0.3 + 0.28 * (qn.length / Math.max(tn.length, qn.length)));
  }
  if (qn.includes(tn) && tn.length >= minLen) {
    return Math.min(0.52, 0.26 + 0.26 * (tn.length / Math.max(qn.length, tn.length)));
  }
  const maxL = longestCommonSubstringLength(qn, tn);
  const minSide = Math.min(qn.length, tn.length);
  if (minSide === 0 || maxL < minLen) return 0;
  const ratio = maxL / minSide;
  if (ratio < 0.38) return 0;
  return Math.min(0.46, 0.16 + ratio * 0.42);
}

/**
 * Light CJK character overlap — requires ≥3 shared chars to reduce junk matches.
 */
function scoreCjkOverlap(queryPart, corpusText) {
  const A = cjkChars(queryPart);
  const B = cjkChars(corpusText);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const c of A) {
    if (B.has(c)) inter++;
  }
  if (inter < 3) return 0;
  const union = A.size + B.size - inter;
  const j = union > 0 ? inter / union : 0;
  return Math.min(0.44, 0.1 + j * 0.6);
}

/** Goal string appears in topic/body (bounded). */
function scoreGoalOverlap(goal, topicBody) {
  const g = String(goal || "").trim();
  if (g.length < 2) return 0;
  const hay = String(topicBody || "").toLowerCase();
  if (!hay.includes(g.toLowerCase())) return 0;
  return Math.min(0.22, 0.12 + Math.min(g.length, 8) * 0.012);
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

function buildQueryContext(keyword, platform, goal) {
  const kw = String(keyword || "");
  const plat = String(platform || "").toLowerCase().trim();
  const g = String(goal || "").trim();
  const queryTokens = tokenize([kw, plat, g].filter(Boolean).join(" "));
  const normCompact = normalizePhrase(kw).replace(/\s/g, "");
  return { queryTokens, normCompact, keywordNorm: normalizePhrase(kw), goal: g, platform: plat };
}

function platformAlignedForExpanded(a, lane, ctx) {
  const wf = String(a.workflow_id || "").toLowerCase().trim();
  const plat = ctx ? String(ctx.platform || "").toLowerCase().trim() : "";
  if (lane === "agent_high_quality_assets") {
    return !wf || !plat || wf === plat;
  }
  return !plat || !wf || wf === plat;
}

function scoreAssetFull(ctx, a, lane) {
  const text = `${a.topic}\n${a.body}`;
  const topicCompact = normalizePhrase(a.topic).replace(/\s/g, "");
  const textCompact = normalizePhrase(text).replace(/\s/g, "");
  const aligned = platformAlignedForExpanded(a, lane, ctx);
  let expanded = 0;
  if (aligned) {
    const qComp = ctx.normCompact + ctx.goal.replace(/\s/g, "");
    expanded = Math.max(
      scoreSubstringOverlap(ctx.normCompact, topicCompact),
      scoreSubstringOverlap(ctx.normCompact, textCompact),
      scoreSubstringOverlap(qComp, textCompact),
      scoreCjkOverlap(ctx.keywordNorm + ctx.goal, `${a.topic}\n${a.body}`),
      scoreGoalOverlap(ctx.goal, `${a.topic}\n${a.body}`)
    );
  }
  const base = scoreOverlap(ctx.queryTokens, text);
  const combined = Math.min(1, Math.max(base, expanded));
  return {
    score: combined,
    base,
    expanded,
    platformAligned: aligned,
    matchMeta: { base, expanded, platformAligned: aligned }
  };
}

function workflowBucketItemCount(platform) {
  const raw = loadJson(WF_PATH, null);
  const byWf = raw && typeof raw === "object" ? raw.buckets?.by_workflow : null;
  if (!byWf || typeof byWf !== "object") return 0;
  const ids = byWf[String(platform || "").toLowerCase()];
  return Array.isArray(ids) ? ids.length : 0;
}

function hasTopicSimilaritySignal(hit) {
  const m = hit?.matchMeta;
  if (!m) return (hit?.score ?? 0) >= 0.18;
  if (m.expanded >= ACTIVATION_MIN_SIGNAL_EXPANDED) return true;
  if (m.base >= ACTIVATION_MIN_SIGNAL_BASE) return true;
  return (hit?.score ?? 0) >= ACTIVATION_MIN_TOP_SCORE;
}

function tryActivationPass(hits, t1, t2a, t2b, { datasetReady, platform }) {
  if (!datasetReady) return { ok: false };
  const bucketN = workflowBucketItemCount(platform);
  if (bucketN < 1) return { ok: false };
  const h0 = hits[0];
  if (!h0 || (h0.score ?? 0) < ACTIVATION_MIN_TOP_SCORE) return { ok: false };
  if (!hasTopicSimilaritySignal(h0)) return { ok: false };
  const mult = ACTIVATION_THRESHOLD_MULT;
  const t1p = t1 * mult;
  const t2ap = t2a * mult;
  const t2bp = t2b * mult;
  if (passesScoreThresholds(hits, t1p, t2ap, t2bp)) {
    return { ok: true, thresholds: { t1: t1p, t2a: t2ap, t2b: t2bp } };
  }
  return { ok: false };
}

/**
 * Search HQ first, then workflow assets. Returns ranked hits with scores 0..1.
 */
function searchRetrievalForKeyword({ keyword, platform, goal }) {
  const ctx = buildQueryContext(keyword, platform, goal);
  const hq = loadHighQualityAssets();
  const wf = loadWorkflowAssets();

  const ranked = [];
  for (const a of hq) {
    const r = scoreAssetFull(ctx, a, "agent_high_quality_assets");
    const row = { ...a, score: r.score, matchMeta: r.matchMeta, lane: "agent_high_quality_assets" };
    if (r.score > MIN_HIT_SCORE) ranked.push(row);
  }
  ranked.sort((x, y) => y.score - x.score);

  if (ranked.length >= 2) return { hits: ranked.slice(0, 8), primaryLane: "agent_high_quality_assets", queryContext: ctx };

  const wfRanked = [];
  for (const a of wf) {
    const r = scoreAssetFull(ctx, a, "workflow_assets");
    const row = { ...a, score: r.score, matchMeta: r.matchMeta, lane: "workflow_assets" };
    if (r.score > MIN_HIT_SCORE) wfRanked.push(row);
  }
  wfRanked.sort((x, y) => y.score - x.score);

  const merged = [...ranked, ...wfRanked].sort((x, y) => y.score - x.score);
  return {
    hits: merged.slice(0, 8),
    primaryLane: ranked.length ? "agent_high_quality_assets" : "workflow_assets",
    queryContext: ctx
  };
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
 * V166.1 — activation pass + expanded matching.
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
      bias: { biasApplied: false, biasFactor: 1 },
      activationPassUsed: false
    };
  }

  const minRows = retrievalDatasetMinRows();
  const dsCount = workflowDatasetCount();
  const datasetReady = dsCount >= minRows;
  if (!datasetReady) {
    return {
      hits: [],
      sufficient: false,
      fallbackReason: "dataset_not_ready",
      primaryLane: null,
      topScore: null,
      thresholds: null,
      bias: { biasApplied: false, biasFactor: 1 },
      activationPassUsed: false
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
      bias: { biasApplied: false, biasFactor: 1 },
      activationPassUsed: false
    };
  }

  const ease = getRetrievalEaseMultiplier();
  let t2a = 0.12 / ease;
  let t2b = 0.08 / ease;
  let t1 = 0.35 / ease;

  const strongWorkflow = isStrongWorkflow(platform, WF_PATH);
  const adj = applyBoundedBiasToThresholds(t1, t2a, t2b, { datasetReady, strongWorkflow });
  t1 = adj.t1;
  t2a = adj.t2a;
  t2b = adj.t2b;

  let sufficient = passesScoreThresholds(hits, t1, t2a, t2b);
  const topScore = hits[0]?.score ?? null;
  let activationPassUsed = false;
  let thresholdsOut = { t1, t2a, t2b };

  if (!sufficient) {
    const act = tryActivationPass(hits, t1, t2a, t2b, { datasetReady, platform });
    if (act.ok) {
      sufficient = true;
      activationPassUsed = true;
      thresholdsOut = act.thresholds;
    }
  }

  if (!sufficient) {
    return {
      hits,
      sufficient: false,
      fallbackReason: "score_below_threshold",
      primaryLane,
      topScore,
      thresholds: { t1, t2a, t2b },
      bias: { biasApplied: adj.biasApplied, biasFactor: adj.biasFactor },
      activationPassUsed: false
    };
  }

  return {
    hits,
    sufficient: true,
    fallbackReason: null,
    primaryLane,
    topScore,
    thresholds: thresholdsOut,
    bias: { biasApplied: adj.biasApplied, biasFactor: adj.biasFactor },
    activationPassUsed
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
  WF_PATH,
  // V166.1 — test hooks
  buildQueryContext,
  scoreAssetFull,
  scoreSubstringOverlap,
  scoreCjkOverlap,
  scoreGoalOverlap,
  tryActivationPass,
  workflowBucketItemCount,
  ACTIVATION_THRESHOLD_MULT,
  ACTIVATION_MIN_TOP_SCORE,
  MIN_HIT_SCORE
};
