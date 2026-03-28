/**
 * V153 — generated/asset-seo-cost-efficiency.json
 */

const fs = require("fs");
const path = require("path");

const { isSeoDryRun, pathInSandbox } = require("./seo-sandbox-context");
const OUT = isSeoDryRun()
  ? pathInSandbox(process.cwd(), "asset-seo-cost-efficiency.json")
  : path.join(process.cwd(), "generated", "asset-seo-cost-efficiency.json");

function ensureDir(p) {
  const d = path.dirname(p);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

/**
 * @param {object} params
 * @param {{ retrieval: number, ai: number, highCost: number, topicModes: Record<string, { retrieval: number, ai: number }> }} params.runStats
 */
function writeCostEfficiencyArtifact({ runStats, zhKeywordsSnapshot }) {
  const r = runStats.retrieval || 0;
  const a = runStats.ai || 0;
  const total = r + a;
  const retrieval_share = total ? r / total : 0;
  const ai_share = total ? a / total : 0;
  const high_cost_usage_rate = total ? (runStats.highCost || 0) / total : 0;

  const unitsLow = r * 1 + (a - (runStats.highCost || 0)) * 2 + (runStats.highCost || 0) * 8;
  const avg_cost_per_page = total ? Math.round((unitsLow / total) * 100) / 100 : 0;

  const topicModes = runStats.topicModes || {};
  const topicEntries = Object.entries(topicModes).map(([topic, v]) => ({
    topic,
    retrieval: v.retrieval || 0,
    ai: v.ai || 0
  }));

  const top_low_cost_topics = topicEntries
    .filter((t) => t.retrieval >= t.ai)
    .sort((x, y) => y.retrieval - x.retrieval)
    .slice(0, 15)
    .map((t) => t.topic);

  const topics_with_high_ai_usage = topicEntries
    .filter((t) => t.ai > t.retrieval + 1)
    .sort((x, y) => y.ai - x.ai)
    .slice(0, 20)
    .map((t) => t.topic);

  const payload = {
    updated_at: new Date().toISOString(),
    retrieval_share,
    ai_share,
    avg_cost_per_page,
    high_cost_usage_rate,
    top_low_cost_topics,
    topics_with_high_ai_usage,
    run_total_pages: total,
    zh_keywords_sample_size: zhKeywordsSnapshot ?? null
  };

  ensureDir(OUT);
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2), "utf8");
  return payload;
}

module.exports = { writeCostEfficiencyArtifact, OUT };
