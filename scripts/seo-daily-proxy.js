#!/usr/bin/env node
/**
 * V170 — `npm run seo:daily` proxies to daily-engine (single production entry).
 * Forward args: --dry-run, --skip-quality, --max-retry=N, --no-stop-on-error
 */
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");
const engine = path.join(__dirname, "daily-engine.js");
const extra = process.argv.slice(2);

console.warn(
  "[V170] npm run seo:daily is deprecated and forwards to daily-engine.\n" +
    "  Production cron / scheduler: npm run daily-engine\n" +
    "  Legacy V154 orchestrator only: npm run seo:orchestrator"
);

const r = spawnSync(process.execPath, [engine, ...extra], {
  cwd: root,
  stdio: "inherit",
  env: process.env
});
process.exit(r.status === null ? 1 : r.status);
