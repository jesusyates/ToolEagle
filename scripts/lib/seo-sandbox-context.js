/**
 * V157 — Plain Node helpers for scripts/*.js (no tsx required).
 * Parent sets SEO_DRY_RUN=1 for sandbox/dry-run ticks.
 */

const fs = require("fs");
const path = require("path");

function isSeoDryRun() {
  return process.env.SEO_DRY_RUN === "1" || process.env.SEO_SANDBOX === "1";
}

function sandboxRoot(cwd = process.cwd()) {
  return path.join(cwd, "generated", "sandbox");
}

function ensureSandboxDir(cwd = process.cwd()) {
  const r = sandboxRoot(cwd);
  if (!fs.existsSync(r)) fs.mkdirSync(r, { recursive: true });
  return r;
}

/** Path under generated/sandbox/... (segments relative to sandbox root). */
function pathInSandbox(cwd, ...segments) {
  return path.join(ensureSandboxDir(cwd), ...segments);
}

module.exports = {
  isSeoDryRun,
  sandboxRoot,
  ensureSandboxDir,
  pathInSandbox
};
