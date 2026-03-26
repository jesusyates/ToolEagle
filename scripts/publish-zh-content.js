/**
 * v59 Publishing Control - Set which zh pages are live.
 * Run: npm run zh:publish -- --limit=200
 *
 * - Reads data/zh-seo.json
 * - Sorts pages by createdAt (newest first) or lastModified
 * - Sets first N pages → published: true, rest → published: false
 */

const path = require("path");
const fs = require("fs");
const {
  validateZhGuideContent,
  computeSimilarityAgainstCorpus,
  loadFingerprintStore,
  saveFingerprintStore,
  writeRejectionLog,
  nowIso
} = require("./lib/seo-quality-gate");

const CACHE_PATH = path.join(process.cwd(), "data", "zh-seo.json");
const FINGERPRINT_STORE = path.join(process.cwd(), "generated", "quality-gate", "zh-guide-fingerprints.json");
const REJECTION_LOG = path.join(process.cwd(), "logs", "quality-gate-rejections.jsonl");

function loadCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
  } catch (e) {
    console.error("Could not load zh-seo.json:", e.message);
    process.exit(1);
  }
}

function saveCache(cache) {
  const dir = path.dirname(CACHE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), "utf8");
}

function main() {
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : 200;

  if (isNaN(limit) || limit < 0) {
    console.error("Invalid --limit. Use: --limit=200");
    process.exit(1);
  }

  const cache = loadCache();
  const entries = [];
  const corpus = loadFingerprintStore(FINGERPRINT_STORE);

  for (const [pageType, topics] of Object.entries(cache)) {
    if (typeof topics !== "object" || topics === null) continue;
    for (const [topic, data] of Object.entries(topics)) {
      if (typeof data !== "object" || data === null) continue;
      const ts = data.createdAt ?? data.lastModified ?? 0;
      entries.push({ pageType, topic, data, ts });
    }
  }

  entries.sort((a, b) => b.ts - a.ts);

  let published = 0;
  let hidden = 0;
  let rejected = 0;

  if (entries.length === 0) {
    console.log("No zh pages in cache. Run: npm run zh:generate");
    process.exit(0);
    return;
  }

  entries.forEach(({ pageType, topic, data }, index) => {
    const shouldPublish = index < limit;
    if (!shouldPublish) {
      cache[pageType][topic] = { ...data, published: false };
      hidden++;
      return;
    }

    const textForSim = [
      data?.title,
      data?.directAnswer,
      data?.intro,
      data?.guide,
      data?.stepByStep,
      data?.faq,
      data?.strategy,
      data?.tips
    ]
      .filter(Boolean)
      .join("\n");
    const sim = computeSimilarityAgainstCorpus(textForSim, corpus, { similarityMax: 0.94 });
    const gate = validateZhGuideContent({
      pageType,
      topic,
      content: data,
      similarity: sim.bestSimilarity
    });
    if (!gate.ok) {
      cache[pageType][topic] = { ...data, published: false };
      hidden++;
      rejected++;
      writeRejectionLog(
        {
          at: nowIso(),
          ...gate.meta,
          reasons: gate.reasons,
          bestSimilarity: sim.bestSimilarity,
          bestMatchId: sim.bestMatchId
        },
        REJECTION_LOG
      );
      return;
    }

    cache[pageType][topic] = { ...data, published: true };
    published++;
    corpus.push({ id: `${pageType}:${topic}`, slug: `${pageType}/${topic}`, hashes: sim.hashes });
  });

  saveCache(cache);
  saveFingerprintStore(FINGERPRINT_STORE, corpus);

  // Daily SEO ledger: record newly published zh topics (diff vs previous snapshot).
  // This makes "每天发了多少/发了什么" fully automatic.
  try {
    const { recordSeoLedger } = require("./seo-ledger");
    recordSeoLedger({ reason: `zh:publish limit=${limit}` });
  } catch (e) {
    // Ledger must never break publishing.
    console.warn("[seo-ledger] skipped:", e?.message || String(e));
  }

  console.log("\n--- ZH Publish Summary ---");
  console.log(`Total pages: ${entries.length}`);
  console.log(`Published: ${published}`);
  console.log(`Hidden: ${hidden}`);
  console.log(`Rejected by quality gate: ${rejected}`);
  console.log("-------------------------\n");
}

main();
