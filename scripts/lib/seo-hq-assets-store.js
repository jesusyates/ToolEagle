/**
 * V163.1 — Persist high-quality assets for retrieval flywheel (dedup + cap 5000).
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const MAX_ASSETS = 5000;
const DEFAULT_HQ_PATH = path.join(process.cwd(), "generated", "agent_high_quality_assets.json");

function hashDedup(title, structure) {
  return crypto.createHash("sha256").update(`${String(title || "")}|${String(structure || "")}`, "utf8").digest("hex");
}

function normalizeList(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw && Array.isArray(raw.items)) return raw.items;
  if (raw && Array.isArray(raw.assets)) return raw.assets;
  return [];
}

/**
 * @param {string} cwd
 * @param {{
 *   topic: string;
 *   workflow: string;
 *   page_type: string;
 *   content_summary: string;
 *   quality_score: number;
 *   title?: string;
 *   structure?: string;
 * }} row
 */
function appendHighQualityAsset(cwd, row) {
  const hqPath = path.join(cwd, "generated", "agent_high_quality_assets.json");
  const title = row.title || row.topic || "";
  const structure = row.structure || row.content_summary?.slice(0, 2000) || "";
  const dedupHash = hashDedup(title, structure);
  let list = [];
  try {
    list = normalizeList(JSON.parse(fs.readFileSync(hqPath, "utf8")));
  } catch {
    list = [];
  }
  if (list.some((a) => a.dedup_hash === dedupHash)) {
    return { added: false, dedup_hash: dedupHash, total: list.length };
  }
  const id = `hq-${dedupHash.slice(0, 16)}`;
  const entry = {
    id,
    topic: String(row.topic || ""),
    workflow: String(row.workflow || ""),
    page_type: String(row.page_type || ""),
    content_summary: String(row.content_summary || "").slice(0, 4000),
    quality_score: Math.min(1, Math.max(0, Number(row.quality_score) || 0)),
    created_at: new Date().toISOString(),
    dedup_hash: dedupHash
  };
  list.push(entry);
  list.sort((a, b) => Number(b.quality_score || 0) - Number(a.quality_score || 0));
  if (list.length > MAX_ASSETS) list = list.slice(0, MAX_ASSETS);
  fs.mkdirSync(path.dirname(hqPath), { recursive: true });
  fs.writeFileSync(hqPath, JSON.stringify(list, null, 2), "utf8");
  try {
    spawnSync("npx", ["tsx", "scripts/build-retrieval-dataset.ts"], {
      cwd,
      stdio: "ignore",
      shell: true,
      env: process.env
    });
  } catch {
    // non-fatal: seo:status / orchestrator will rebuild
  }
  return { added: true, dedup_hash: dedupHash, total: list.length };
}

/**
 * @param {string} cwd
 * @param {{ retrieval_delta?: number; ai_delta?: number }} d
 */
function mergeRetrievalStats(cwd, d) {
  const p = path.join(cwd, "generated", "seo-retrieval-stats.json");
  let prev = { retrieval_count: 0, ai_generation_count: 0, retrieval_share: 0, updatedAt: null };
  try {
    prev = { ...prev, ...JSON.parse(fs.readFileSync(p, "utf8")) };
  } catch {
    // fresh
  }
  const retrieval_count = Number(prev.retrieval_count || 0) + Number(d.retrieval_delta || 0);
  const ai_generation_count = Number(prev.ai_generation_count || 0) + Number(d.ai_delta || 0);
  const total = retrieval_count + ai_generation_count;
  const retrieval_share = total > 0 ? Math.round((retrieval_count / total) * 1000) / 1000 : 0;
  const out = {
    updatedAt: new Date().toISOString(),
    retrieval_count,
    ai_generation_count,
    retrieval_share
  };
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(out, null, 2), "utf8");
  return out;
}

function countHighQualityAssets(cwd) {
  const hqPath = path.join(cwd, "generated", "agent_high_quality_assets.json");
  try {
    return normalizeList(JSON.parse(fs.readFileSync(hqPath, "utf8"))).length;
  } catch {
    return 0;
  }
}

module.exports = {
  appendHighQualityAsset,
  mergeRetrievalStats,
  countHighQualityAssets,
  MAX_ASSETS,
  DEFAULT_HQ_PATH
};
