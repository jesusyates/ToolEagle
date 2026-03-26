/**
 * V96 — SEO Content Quality Gate (Node-only)
 *
 * Goal: hard-fail low-quality / placeholder / thin / duplicate-looking pages before publish.
 * This module is used by generation + publish scripts and deploy:prep.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DEFAULT_PLACEHOLDER_PHRASES = [
  "Example 1",
  "Example 2",
  "Placeholder",
  "TBD",
  "Coming soon",
  "Lorem ipsum"
];

function ensureDir(p) {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function nowIso() {
  return new Date().toISOString();
}

function sha1(s) {
  return crypto.createHash("sha1").update(String(s || ""), "utf8").digest("hex");
}

function normalizeText(s) {
  return String(s || "")
    .replace(/\r\n/g, "\n")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s#:/._-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractFirstNumber(s) {
  const m = String(s || "").match(/\b(\d{2,4})\b/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}

function countNumberedListItems(markdown) {
  const lines = String(markdown || "").split("\n");
  let count = 0;
  for (const line of lines) {
    if (/^\s*\d+\.\s+/.test(line)) count++;
  }
  return count;
}

function countNonEmptySections(sections) {
  return Object.entries(sections).filter(([, v]) => typeof v === "string" && v.trim().length > 0).length;
}

function containsPlaceholders(text, placeholders = DEFAULT_PLACEHOLDER_PHRASES) {
  const t = String(text || "");
  return placeholders.filter((p) => t.toLowerCase().includes(String(p).toLowerCase()));
}

/**
 * Fingerprint for similarity guard: hashed 5-word shingles.
 * We keep it simple + deterministic to avoid extra deps.
 */
function shingleHashes(text, shingleSize = 5, limit = 5000) {
  const tokens = normalizeText(text).split(" ").filter(Boolean);
  const hashes = new Set();
  const max = Math.min(tokens.length - shingleSize + 1, limit);
  for (let i = 0; i < max; i++) {
    const sh = tokens.slice(i, i + shingleSize).join(" ");
    hashes.add(sha1(sh).slice(0, 12));
  }
  return hashes;
}

function jaccard(a, b) {
  if (!a || !b) return 0;
  const aSize = a.size;
  const bSize = b.size;
  if (aSize === 0 || bSize === 0) return 0;
  let inter = 0;
  const [small, large] = aSize < bSize ? [a, b] : [b, a];
  for (const x of small) {
    if (large.has(x)) inter++;
  }
  const union = aSize + bSize - inter;
  return union === 0 ? 0 : inter / union;
}

function writeRejectionLog(entry, logPath) {
  if (!logPath) return;
  ensureDir(logPath);
  fs.appendFileSync(logPath, JSON.stringify(entry) + "\n", "utf8");
}

/**
 * Generic validation result.
 */
function okResult(meta, extra = {}) {
  return { ok: true, meta, ...extra };
}

function failResult(meta, reasons, extra = {}) {
  return { ok: false, meta, reasons: Array.from(new Set(reasons)).sort(), ...extra };
}

/**
 * Validate EN blog MDX content (frontmatter already assembled in-memory).
 */
function validateEnBlogMdx({
  slug,
  title,
  description,
  body,
  recommendedTools = [],
  minBodyChars = 900,
  minNonEmptySections = 3,
  similarity,
  similarityMax = 0.92
}) {
  const meta = { kind: "en_blog_mdx", slug, title };
  const reasons = [];

  const placeholders = containsPlaceholders([title, description, body].join("\n"));
  if (placeholders.length > 0) reasons.push(`placeholder_phrases:${placeholders.join("|")}`);

  const bodyText = String(body || "").trim();
  if (bodyText.length < minBodyChars) reasons.push(`body_too_short:${bodyText.length}<${minBodyChars}`);

  const sections = {
    intro: bodyText.split("\n").slice(0, 8).join("\n"),
    body: bodyText,
    outro: bodyText.split("\n").slice(-8).join("\n")
  };
  if (countNonEmptySections(sections) < minNonEmptySections) reasons.push("too_few_non_empty_sections");

  // Require at least one tool slug + at least one internal resource block.
  if (!Array.isArray(recommendedTools) || recommendedTools.length < 1) reasons.push("missing_related_tool");
  const hasToolLink = /\/tools\/[a-z0-9-]+/i.test(bodyText);
  if (!hasToolLink) reasons.push("missing_internal_tool_link");
  const hasResourceLink =
    /\/blog\/[a-z0-9-]+/i.test(bodyText) ||
    /\/learn-ai(\/[a-z0-9-]+)?/i.test(bodyText) ||
    /\/en\/how-to(\/[a-z0-9-]+)?/i.test(bodyText) ||
    /\/tiktok-growth-kit\b/i.test(bodyText);
  if (!hasResourceLink) reasons.push("missing_internal_resource_block");

  // Quantity mismatch guard for listicles: title says N but body has too few usable list items.
  const n = extractFirstNumber(title);
  // Guard against treating years/large numbers (e.g. 2025) as list counts.
  if (n && n >= 10 && n < 300) {
    const bodyListCount = countNumberedListItems(bodyText);
    const minExpected = Math.max(3, Math.floor(n * 0.4));
    if (bodyListCount > 0 && bodyListCount < minExpected) {
      reasons.push(`quantity_mismatch:title=${n},body_items=${bodyListCount}`);
    }
  }

  if (typeof similarity === "number" && similarity >= similarityMax) {
    reasons.push(`too_similar:${similarity.toFixed(3)}>=${similarityMax}`);
  }

  if (reasons.length > 0) return failResult(meta, reasons);
  return okResult(meta);
}

/**
 * Validate zh keyword page content (data/zh-keywords.json entries used by /zh/search/[slug]).
 */
function validateZhKeywordContent({
  slug,
  keyword,
  content,
  minBodyChars = 900,
  minNonEmptySections = 5,
  similarity,
  similarityMax = 0.94
}) {
  const meta = { kind: "zh_keyword", slug, keyword };
  const reasons = [];
  const c = content || {};
  const combined = [
    c.title,
    c.description,
    c.h1,
    c.directAnswer,
    c.intro,
    c.guide,
    c.stepByStep,
    c.faq,
    c.strategy,
    c.tips,
    Array.isArray(c.resultPreview) ? c.resultPreview.join("\n") : ""
  ].join("\n");

  const placeholders = containsPlaceholders(combined);
  if (placeholders.length > 0) reasons.push(`placeholder_phrases:${placeholders.join("|")}`);

  const sections = {
    directAnswer: c.directAnswer,
    intro: c.intro,
    guide: c.guide,
    stepByStep: c.stepByStep,
    faq: c.faq,
    tips: c.tips,
    strategy: c.strategy
  };
  const nonEmpty = countNonEmptySections(sections);
  if (nonEmpty < minNonEmptySections) reasons.push(`too_few_non_empty_sections:${nonEmpty}<${minNonEmptySections}`);

  const bodyLen = normalizeText(
    [c.intro, c.guide, c.stepByStep, c.faq, c.strategy, c.tips].filter(Boolean).join("\n")
  ).length;
  if (bodyLen < minBodyChars) reasons.push(`body_too_short:${bodyLen}<${minBodyChars}`);

  // listicle quality: if title contains a large number, require enough numbered items across guide/stepByStep/tips.
  const n = extractFirstNumber(c.title || "");
  if (n && n >= 10 && n < 300) {
    const bodyListCount =
      countNumberedListItems(c.guide || "") +
      countNumberedListItems(c.stepByStep || "") +
      countNumberedListItems(c.tips || "");
    const minExpected = Math.max(3, Math.floor(n * 0.35));
    if (bodyListCount > 0 && bodyListCount < minExpected) {
      reasons.push(`quantity_mismatch:title=${n},body_items=${bodyListCount}`);
    }
  }

  // Require at least 1 preview example (this is the “internal resource style” proof block on zh pages).
  if (!Array.isArray(c.resultPreview) || c.resultPreview.filter((x) => String(x || "").trim()).length < 1) {
    reasons.push("missing_result_preview");
  }

  if (typeof similarity === "number" && similarity >= similarityMax) {
    reasons.push(`too_similar:${similarity.toFixed(3)}>=${similarityMax}`);
  }

  if (reasons.length > 0) return failResult(meta, reasons);
  return okResult(meta);
}

/**
 * Validate zh guide-style pages stored in data/zh-seo.json (used by /zh/how-to etc).
 */
function validateZhGuideContent({
  pageType,
  topic,
  content,
  minBodyChars = 900,
  minNonEmptySections = 4,
  similarity,
  similarityMax = 0.94
}) {
  const meta = { kind: "zh_guide", pageType, topic };
  const reasons = [];
  const c = content || {};
  const combined = [c.title, c.description, c.h1, c.directAnswer, c.intro, c.guide, c.stepByStep, c.faq, c.strategy, c.tips].join("\n");

  const placeholders = containsPlaceholders(combined);
  if (placeholders.length > 0) reasons.push(`placeholder_phrases:${placeholders.join("|")}`);

  const sections = {
    directAnswer: c.directAnswer,
    intro: c.intro,
    guide: c.guide,
    stepByStep: c.stepByStep,
    faq: c.faq,
    tips: c.tips,
    strategy: c.strategy
  };
  const nonEmpty = countNonEmptySections(sections);
  if (nonEmpty < minNonEmptySections) reasons.push(`too_few_non_empty_sections:${nonEmpty}<${minNonEmptySections}`);

  const bodyLen = normalizeText(
    [c.intro, c.guide, c.stepByStep, c.faq, c.strategy, c.tips].filter(Boolean).join("\n")
  ).length;
  if (bodyLen < minBodyChars) reasons.push(`body_too_short:${bodyLen}<${minBodyChars}`);

  const n = extractFirstNumber(c.title || "");
  if (n && n >= 10 && n < 300) {
    const bodyListCount =
      countNumberedListItems(c.guide || "") +
      countNumberedListItems(c.stepByStep || "") +
      countNumberedListItems(c.tips || "");
    const minExpected = Math.max(3, Math.floor(n * 0.35));
    if (bodyListCount > 0 && bodyListCount < minExpected) {
      reasons.push(`quantity_mismatch:title=${n},body_items=${bodyListCount}`);
    }
  }

  if (typeof similarity === "number" && similarity >= similarityMax) {
    reasons.push(`too_similar:${similarity.toFixed(3)}>=${similarityMax}`);
  }

  if (reasons.length > 0) return failResult(meta, reasons);
  return okResult(meta);
}

function computeSimilarityAgainstCorpus(text, corpusFingerprints, opts = {}) {
  const { similarityMax = 0.92 } = opts;
  const hashes = shingleHashes(text);
  let best = 0;
  let bestId = null;
  for (const fp of corpusFingerprints || []) {
    if (!fp || !fp.hashes) continue;
    const score = jaccard(hashes, fp.hashes);
    if (score > best) {
      best = score;
      bestId = fp.id || fp.slug || null;
    }
    if (score >= similarityMax) break;
  }
  return { bestSimilarity: best, bestMatchId: bestId, hashes };
}

/**
 * Load corpus fingerprints from an array of {id, hashes:Set<string>} persisted as JSON.
 */
function loadFingerprintStore(storePath) {
  try {
    const raw = fs.readFileSync(storePath, "utf8");
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed?.items) ? parsed.items : [];
    return items.map((it) => ({
      id: it.id,
      slug: it.slug,
      hashes: new Set(Array.isArray(it.hashes) ? it.hashes : [])
    }));
  } catch {
    return [];
  }
}

function saveFingerprintStore(storePath, items) {
  ensureDir(storePath);
  const out = {
    updatedAt: nowIso(),
    items: (items || []).map((it) => ({
      id: it.id,
      slug: it.slug,
      hashes: Array.from(it.hashes || [])
    }))
  };
  fs.writeFileSync(storePath, JSON.stringify(out, null, 2), "utf8");
}

module.exports = {
  DEFAULT_PLACEHOLDER_PHRASES,
  normalizeText,
  computeSimilarityAgainstCorpus,
  loadFingerprintStore,
  saveFingerprintStore,
  validateEnBlogMdx,
  validateZhKeywordContent,
  validateZhGuideContent,
  writeRejectionLog,
  nowIso
};

