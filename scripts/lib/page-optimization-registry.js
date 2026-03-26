/**
 * V113 — Page optimization registry (append entries on --write)
 */

const fs = require("fs");
const path = require("path");

const REGISTRY_PATH = path.join(process.cwd(), "generated", "page-optimization-registry.json");

function loadRegistry() {
  try {
    if (!fs.existsSync(REGISTRY_PATH)) {
      return { updatedAt: null, version: 1, entries: [] };
    }
    const j = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
    if (!Array.isArray(j.entries)) j.entries = [];
    return j;
  } catch {
    return { updatedAt: null, version: 1, entries: [] };
  }
}

function saveRegistry(doc) {
  fs.mkdirSync(path.dirname(REGISTRY_PATH), { recursive: true });
  doc.updatedAt = new Date().toISOString();
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(doc, null, 2), "utf8");
}

/**
 * @param {object} entry - full audit entry
 */
function appendEntry(entry) {
  const doc = loadRegistry();
  doc.entries.push(entry);
  saveRegistry(doc);
  return entry;
}

function appendEntries(entries) {
  if (!entries?.length) return;
  const doc = loadRegistry();
  doc.entries.push(...entries);
  saveRegistry(doc);
}

module.exports = {
  REGISTRY_PATH,
  loadRegistry,
  saveRegistry,
  appendEntry,
  appendEntries
};
