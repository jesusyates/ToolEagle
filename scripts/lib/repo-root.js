/**
 * Resolve ToolEagle repo root without relying on shell cwd (Task Scheduler / cron).
 * Override: TOOLEAGLE_REPO_ROOT=/abs/path (must contain package.json).
 */

const fs = require("fs");
const path = require("path");

const MODULE_DIR = __dirname;

/**
 * @param {string} [startDir] - Directory to walk upward from (default: this file's dir → repo root).
 * @returns {string}
 */
function resolveRepoRoot(startDir) {
  if (process.env.TOOLEAGLE_REPO_ROOT) {
    const r = path.resolve(process.env.TOOLEAGLE_REPO_ROOT);
    if (fs.existsSync(path.join(r, "package.json"))) return r;
  }
  let dir = path.resolve(startDir != null ? startDir : MODULE_DIR);
  for (let i = 0; i < 14; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(MODULE_DIR, "..", "..");
}

function resolveGeneratedPath(repoRoot, ...segments) {
  return path.join(repoRoot, "generated", ...segments);
}

function resolveLogsPath(repoRoot, ...segments) {
  return path.join(repoRoot, "logs", ...segments);
}

module.exports = { resolveRepoRoot, resolveGeneratedPath, resolveLogsPath };
