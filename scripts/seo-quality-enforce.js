/**
 * V96 — Enforce quality gate by unpublishing failing pages (safe mode).
 *
 * Usage:
 *   node scripts/seo-quality-enforce.js --dry-run
 *   node scripts/seo-quality-enforce.js --apply
 *
 * Current scope:
 * - ZH keyword pages: data/zh-keywords.json (set published=false for failing entries)
 *
 * Notes:
 * - This does NOT regenerate content (keeps version scope focused).
 * - It writes a JSONL audit log so operators can review what got hidden.
 */

const fs = require("fs");
const path = require("path");
const {
  validateZhKeywordContent,
  writeRejectionLog,
  nowIso
} = require("./lib/seo-quality-gate");

const ROOT = process.cwd();
const ZH_KEYWORDS_PATH = path.join(ROOT, "data", "zh-keywords.json");
const AUDIT_LOG = path.join(ROOT, "logs", "quality-gate-enforce.jsonl");

function loadJson(p, fallback) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
}

function saveJson(p, data) {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
}

function main() {
  const args = new Set(process.argv.slice(2));
  const apply = args.has("--apply");
  const dryRun = args.has("--dry-run") || !apply;

  if (!fs.existsSync(ZH_KEYWORDS_PATH)) {
    console.log("Missing data/zh-keywords.json — nothing to enforce.");
    process.exit(0);
    return;
  }

  const cache = loadJson(ZH_KEYWORDS_PATH, {});
  let total = 0;
  let published = 0;
  let failing = 0;
  let wouldUnpublish = 0;
  /** reasonCode -> count */
  const reasonDist = new Map();
  /** top-level reasons from every failing page */

  for (const [slug, data] of Object.entries(cache)) {
    if (!data || typeof data !== "object") continue;
    total++;
    if (data.published === false) continue;
    published++;
    const gate = validateZhKeywordContent({ slug, keyword: data.keyword || data.h1 || slug, content: data });
    if (!gate.ok) {
      failing++;
      wouldUnpublish++;
      for (const r of gate.reasons) reasonDist.set(r, (reasonDist.get(r) ?? 0) + 1);
      if (apply) {
        cache[slug] = { ...data, published: false, lastModified: Date.now() };
      }
      writeRejectionLog(
        {
          at: nowIso(),
          action: apply ? "unpublish" : "would_unpublish",
          ...gate.meta,
          reasons: gate.reasons
        },
        AUDIT_LOG
      );
    }
  }

  if (apply) saveJson(ZH_KEYWORDS_PATH, cache);

  console.log("\n=== V96 Enforce Summary ===");
  console.log(`Mode: ${dryRun ? "dry-run" : "apply"}`);
  console.log(`[ZH keyword] total=${total} published_before=${published} failing=${failing} ${apply ? "unpublished" : "would_unpublish"}=${wouldUnpublish}`);
  if (failing > 0) {
    const top = [...reasonDist.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    console.log(`Top rejection reasons: ${top.map(([k, v]) => `${k}=${v}`).join(" | ")}`);
  } else {
    console.log("Top rejection reasons: none");
  }
  console.log(`Audit log: ${AUDIT_LOG}`);
  console.log("===========================\n");
}

main();

