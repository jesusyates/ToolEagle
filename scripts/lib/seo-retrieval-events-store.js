/**
 * V166 — Append-only retrieval telemetry for utilization summaries (JSONL).
 */

const fs = require("fs");
const path = require("path");

const DEFAULT_MAX_BYTES = 6 * 1024 * 1024;

function eventsPath(cwd) {
  return path.join(cwd, "generated", "seo-retrieval-events.jsonl");
}

function trimJsonlIfHuge(cwd) {
  const p = eventsPath(cwd);
  try {
    const st = fs.statSync(p);
    if (st.size <= DEFAULT_MAX_BYTES) return;
    const raw = fs.readFileSync(p, "utf8");
    const lines = raw.split("\n").filter(Boolean);
    const keep = lines.slice(-4000);
    fs.writeFileSync(p, keep.join("\n") + (keep.length ? "\n" : ""), "utf8");
  } catch {
    // no-op
  }
}

/**
 * @param {string} cwd
 * @param {{
 *   event: 'retrieval_hit_recorded' | 'retrieval_fallback_reason_recorded' | 'retrieval_bias_applied';
 *   keyword?: string;
 *   platform?: string;
 *   goal?: string;
 *   reason?: string;
 *   top_score?: number;
 *   bias_applied?: boolean;
 *   bias_factor?: number;
 *   primary_lane?: string | null;
 * }} payload
 */
function appendRetrievalTelemetryEvent(cwd, payload) {
  const p = eventsPath(cwd);
  const row = {
    ts: new Date().toISOString(),
    ...payload
  };
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.appendFileSync(p, JSON.stringify(row) + "\n", "utf8");
  trimJsonlIfHuge(cwd);
  try {
    const { event, ...rest } = row;
    if (event === "retrieval_hit_recorded") {
      console.info("[retrieval_telemetry]", JSON.stringify({ event: "retrieval_hit_recorded", ...rest }));
    } else if (event === "retrieval_fallback_reason_recorded") {
      console.info(
        "[retrieval_telemetry]",
        JSON.stringify({ event: "retrieval_fallback_reason_recorded", ...rest })
      );
    } else if (event === "retrieval_bias_applied") {
      console.info("[retrieval_telemetry]", JSON.stringify({ event: "retrieval_bias_applied", ...rest }));
    }
  } catch {
    // no-op
  }
}

module.exports = {
  appendRetrievalTelemetryEvent,
  eventsPath
};
