/**
 * V173 — Append blog generation events to shared ops JSONL.
 */
const fs = require("fs");
const path = require("path");

function appendBlogV173(row) {
  try {
    const p = path.join(process.cwd(), "logs", "v173-generation-events.jsonl");
    fs.mkdirSync(path.dirname(p), { recursive: true });
    const line = JSON.stringify({ ts: new Date().toISOString(), ...row }) + "\n";
    fs.appendFileSync(p, line, "utf8");
  } catch {
    /* non-fatal */
  }
}

module.exports = { appendBlogV173 };
