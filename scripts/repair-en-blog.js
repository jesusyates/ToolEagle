/**
 * V97 — Repair historical failing EN blog MDX pages (no new systems).
 *
 * Usage:
 *   node scripts/repair-en-blog.js --only-failing --limit 30
 *   node scripts/repair-en-blog.js --dry-run
 *
 * Behavior:
 * - Scan `content/blog/*.mdx`
 * - Target pages that fail V96 quality gate (placeholders/thin/duplicate-looking/structure)
 * - Regenerate body with "publish-ready content package" framing + Related tools/resources blocks
 * - Overwrite original file only if regenerated content passes the quality gate
 * - Log failed repairs separately
 * - Maintain a temporary protection list for failing slugs so they don't appear in sitemap/recommendations
 */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
require("dotenv").config();

const { openaiChatCompletions, getModel } = require("./lib/openai-fetch");
const {
  validateEnBlogMdx,
  computeSimilarityAgainstCorpus,
  loadFingerprintStore,
  saveFingerprintStore,
  writeRejectionLog,
  nowIso
} = require("./lib/seo-quality-gate");

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const FINGERPRINT_STORE = path.join(process.cwd(), "generated", "quality-gate", "en-blog-fingerprints.json");
const EN_FAIL_SLUGS_OUT = path.join(process.cwd(), "generated", "quality-gate", "en-blog-failing-slugs.json");
const EN_PROTECTED_SLUGS_OUT = path.join(process.cwd(), "generated", "quality-gate", "en-blog-protected-slugs.json");

const REPAIR_LOG = path.join(process.cwd(), "logs", "repair-en-blog.jsonl");
const REPAIR_FAILURE_LOG = path.join(process.cwd(), "logs", "repair-en-blog-failures.jsonl");

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY && getModel()) {
  // In some CI/dev setups the key may be provided under different env var names.
  // We keep this script explicit to avoid silently producing empty outputs.
  if (!process.env.OPENAI_API_KEY) {
    console.warn("Warning: OPENAI_API_KEY is not set; repairs will fail when calling OpenAI.");
  }
}

const DEFAULT_MIN_BODY_CHARS = 900;
const SIMILARITY_MAX = 0.92;

function ensureDir(p) {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function appendJsonl(file, entry) {
  if (!file) return;
  ensureDir(file);
  fs.appendFileSync(file, JSON.stringify(entry) + "\n", "utf8");
}

function readJson(p, fallback) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
}

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  const limitRaw = argv.find((x) => x.startsWith("--limit="));
  const limitFromPos = argv[argv.indexOf("--limit") + 1];
  const limit = limitRaw
    ? parseInt(limitRaw.split("=").pop() || "0", 10)
    : limitFromPos
      ? parseInt(limitFromPos, 10)
      : null;

  return {
    dryRun: args.has("--dry-run"),
    onlyFailing: args.has("--only-failing"),
    limit: Number.isFinite(limit) ? limit : null
  };
}

function extractMdxParts(mdx) {
  const fm = mdx.match(/^---\s*[\s\S]*?\n---\s*\n/m);
  const frontmatterRaw = fm ? fm[0] : "";
  const body = fm ? mdx.slice(frontmatterRaw.length) : mdx;

  const titleMatch = frontmatterRaw.match(/\ntitle:\s*"(.*)"\s*\n/);
  const descMatch = frontmatterRaw.match(/\ndescription:\s*"(.*)"\s*\n/);
  const title = titleMatch ? titleMatch[1] : "";
  const description = descMatch ? descMatch[1] : "";

  return { frontmatterRaw, body, title, description };
}

function guessToolAndTopicFromSlug(slug) {
  const s = String(slug || "").toLowerCase();

  // Keep it conservative: only use mapping that exists in current tool URLs.
  let toolSlug = "tiktok-caption-generator";
  let platform = "TikTok";

  if (s.includes("instagram")) platform = "Instagram";
  if (s.includes("youtube")) platform = "YouTube";

  if (s.includes("hashtag")) {
    toolSlug = "hashtag-generator";
  } else if (s.includes("hook")) {
    toolSlug = "hook-generator";
  } else if (s.includes("title")) {
    toolSlug = s.includes("youtube") ? "youtube-title-generator" : "title-generator";
  } else if (s.includes("caption")) {
    toolSlug = s.includes("instagram") ? "instagram-caption-generator" : "tiktok-caption-generator";
  }

  const typeLabel = s.includes("hashtag") ? "Hashtags" : s.includes("hook") ? "Hooks" : s.includes("title") ? "Titles" : "Captions";

  return { toolSlug, platform, typeLabel };
}

function resourceLinksFor(slug) {
  // Gate only needs one internal resource block, but we provide 2-3 for robustness.
  const s = String(slug || "").toLowerCase();
  if (s.includes("hashtag")) {
    return [
      { href: "/blog/best-hashtags-for-reels", label: "Hashtag strategy" },
      { href: "/learn-ai", label: "Learn AI (prompts & workflows)" },
      { href: "/en/how-to", label: "Creator guides" }
    ];
  }
  if (s.includes("title")) {
    return [
      { href: "/blog/youtube-title-formulas", label: "Title formulas" },
      { href: "/learn-ai", label: "Learn AI (prompts & workflows)" },
      { href: "/en/how-to", label: "Creator guides" }
    ];
  }
  if (s.includes("hook")) {
    return [
      { href: "/blog/how-to-write-viral-hooks", label: "Hook writing guide" },
      { href: "/learn-ai", label: "Learn AI (prompts & workflows)" },
      { href: "/en/how-to", label: "Creator guides" }
    ];
  }
  // Captions default
  return [
    { href: "/blog/best-tiktok-captions-for-views", label: "Caption examples that work" },
    { href: "/learn-ai", label: "Learn AI (prompts & workflows)" },
    { href: "/en/how-to", label: "Creator guides" }
  ];
}

function toolLinksFor(toolSlug, typeLabel) {
  const main = { href: `/tools/${toolSlug}`, label: `${typeLabel} Generator` };
  // Ensure at least two /tools/* links for a better user experience.
  const secondary = toolSlug === "hashtag-generator"
    ? { href: "/tools/tiktok-caption-generator", label: "Caption Generator" }
    : toolSlug === "hook-generator"
      ? { href: "/tools/tiktok-caption-generator", label: "Caption Generator" }
      : toolSlug === "youtube-title-generator"
        ? { href: "/tools/hook-generator", label: "Hook Generator" }
        : { href: "/tools/hook-generator", label: "Hook Generator" };
  return [main, secondary];
}

async function generateBodyViaAI({ slug, title, description }) {
  const { toolSlug, platform, typeLabel } = guessToolAndTopicFromSlug(slug);
  const resourceLinks = resourceLinksFor(slug);
  const toolLinks = toolLinksFor(toolSlug, typeLabel);

  const topicLabel = String(title || slug).replace(/\s+/g, " ").trim();
  const primaryGeneratorLabel = `${platform} ${typeLabel} Generator`;

  // We ask for JSON so the script can deterministically assemble markdown blocks.
  const prompt = `You write for short-form creators. Regenerate an EN blog body as JSON (no markdown fences, no placeholders).

Input:
Title: ${title}
Description: ${description}
Slug: ${slug}
Platform: ${platform}
Content type: ${typeLabel}

Hard requirements:
- NO placeholders like "Example 1/2", "TBD", "Coming soon", "Lorem ipsum".
- Build ONLY JSON with this schema.
- Must create exactly 50 usable items (strings). Each item should be 6-18 words, concrete and niche-aware.
- package framing must include: hook, script beats (3-5 bullets), caption/title, CTA, hashtags (8-14 tags), why it works (2-4 bullets).
- Must keep tone advisory (avoid guaranteed results).
- relatedTools/resources: use the provided hrefs EXACTLY from arrays below.

Provided relatedTools hrefs:
${JSON.stringify(toolLinks.map((l) => ({ href: l.href })), null, 2)}

Provided relatedResources hrefs:
${JSON.stringify(resourceLinks.map((l) => ({ href: l.href })), null, 2)}

Return JSON only:
{
  "intro": "string",
  "items": ["string", "... (exactly 50 items)"],
  "packageFraming": {
    "hook": "string",
    "scriptBeats": ["string", "... (3-5)"],
    "captionOrTitle": "string",
    "cta": "string",
    "hashtags": ["string", "... (8-14)"],
    "whyItWorks": ["string", "... (2-4)"]
  },
  "relatedTools": [
    { "href": "string (from provided href list)", "label": "string" }
  ],
  "relatedResources": [
    { "href": "string (from provided href list)", "label": "string" }
  ]
}`;

  const apiKey = API_KEY;
  const raw = await openaiChatCompletions(
    {
      model: getModel(),
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2600
    },
    apiKey
  );

  // Some models wrap JSON in code fences; we tolerate that.
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, raw];
  const jsonStr = String(jsonMatch[1] || "").trim();
  const parsed = JSON.parse(jsonStr);

  const items = Array.isArray(parsed.items) ? parsed.items.slice(0, 50) : [];
  const pf = parsed.packageFraming || {};
  const hashtags = Array.isArray(pf.hashtags) ? pf.hashtags.map((h) => String(h || "").trim()).filter(Boolean) : [];
  const normalizedHashtags = hashtags
    .map((t) => (t.startsWith("#") ? t : `#${t}`))
    .slice(0, 14)
    .join(" ");

  const relatedTools = Array.isArray(parsed.relatedTools) ? parsed.relatedTools : [];
  const relatedResources = Array.isArray(parsed.relatedResources) ? parsed.relatedResources : [];

  const toolBullets = (relatedTools.length > 0 ? relatedTools : toolLinks)
    .slice(0, 4)
    .map((l) => `- [${l.label || l.href}](${l.href})`)
    .join("\n");

  const resourceBullets = (relatedResources.length > 0 ? relatedResources : resourceLinks)
    .slice(0, 6)
    .map((l) => `- [${l.label || l.href}](${l.href})`)
    .join("\n");

  const beats = Array.isArray(pf.scriptBeats) ? pf.scriptBeats.slice(0, 6) : [];
  const why = Array.isArray(pf.whyItWorks) ? pf.whyItWorks.slice(0, 6) : [];

  const bodyLines = [];
  bodyLines.push(String(parsed.intro || "").trim() || "Turn one idea into a publish-ready content package: hook, script beats, caption/title, CTA, hashtags, and why it works.");
  bodyLines.push("");
  bodyLines.push(`Generate more with the [${primaryGeneratorLabel}](/tools/${toolSlug}).`);
  bodyLines.push("");
  bodyLines.push(`## ${topicLabel}`);
  bodyLines.push("");
  items.forEach((it, i) => bodyLines.push(`${i + 1}. ${String(it || "").trim()}`));
  bodyLines.push("");
  bodyLines.push(`## Publish-ready package framing (what to paste)`);
  bodyLines.push("");
  bodyLines.push(`### Hook`);
  bodyLines.push(String(pf.hook || "").trim() || "A specific hook + curiosity gap in the first line.");
  bodyLines.push("");
  bodyLines.push(`### Script beats`);
  if (beats.length > 0) beats.forEach((b) => bodyLines.push(`- ${String(b || "").trim()}`));
  else {
    bodyLines.push("- Setup: what this is about");
    bodyLines.push("- Proof: quick example");
    bodyLines.push("- Step: one actionable move");
    bodyLines.push("- CTA: ask for a comment/save");
  }
  bodyLines.push("");
  bodyLines.push(`### Caption / title`);
  bodyLines.push(String(pf.captionOrTitle || "").trim() || "Write one promise + one detail + one CTA.");
  bodyLines.push("");
  bodyLines.push(`### CTA`);
  bodyLines.push(String(pf.cta || "").trim() || "Comment your niche and I’ll tailor one version.");
  bodyLines.push("");
  bodyLines.push(`### Hashtags`);
  bodyLines.push(normalizedHashtags || "#creators #shortformvideo #contentstrategy #tiktoktips");
  bodyLines.push("");
  bodyLines.push(`### Why it works`);
  if (why.length > 0) why.forEach((w) => bodyLines.push(`- ${String(w || "").trim()}`));
  else bodyLines.push("- Specificity beats generic inspiration on sound-on feeds.");
  bodyLines.push("");
  bodyLines.push(`## Related tools`);
  bodyLines.push("");
  bodyLines.push(toolBullets);
  bodyLines.push("");
  bodyLines.push(`## Related resources`);
  bodyLines.push("");
  bodyLines.push(resourceBullets);
  bodyLines.push("");
  bodyLines.push(`## Summary`);
  bodyLines.push("");
  bodyLines.push(`Pick 1 idea -> choose 1 package framing -> paste into your post -> ship. Then generate more with [${primaryGeneratorLabel}](/tools/${toolSlug}).`);

  return bodyLines.join("\n").trim();
}

function writeMdxFile({ filePath, frontmatterData, body }) {
  const out = matter.stringify(body, frontmatterData);
  fs.writeFileSync(filePath, out, "utf8");
}

function getRecommendedToolsFromFrontmatter(frontmatter) {
  const v = frontmatter?.recommendedTools ?? frontmatter?.recommended_tools;
  if (Array.isArray(v) && v.length > 0) return v.map((x) => String(x));
  return ["(best-effort)"];
}

function validateMdx({ slug, frontmatter, body, similarity, similarityMax }) {
  return validateEnBlogMdx({
    slug,
    title: String(frontmatter?.title || ""),
    description: String(frontmatter?.description || ""),
    body,
    recommendedTools: getRecommendedToolsFromFrontmatter(frontmatter),
    minBodyChars: DEFAULT_MIN_BODY_CHARS,
    similarity,
    similarityMax
  });
}

function listBlogMdxFiles() {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs.readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => ({ slug: f.replace(/\.mdx$/i, ""), filePath: path.join(BLOG_DIR, f) }));
}

function loadProtectedEnBlogSlugs() {
  try {
    if (!fs.existsSync(EN_PROTECTED_SLUGS_OUT)) return new Set();
    const raw = fs.readFileSync(EN_PROTECTED_SLUGS_OUT, "utf8");
    const parsed = JSON.parse(raw);
    const slugs = parsed?.slugs;
    if (!Array.isArray(slugs)) return new Set();
    return new Set(slugs.map((s) => String(s)));
  } catch {
    return new Set();
  }
}

async function main() {
  const { dryRun, onlyFailing, limit } = parseArgs(process.argv);

  const files = listBlogMdxFiles();
  const corpusFingerprints = loadFingerprintStore(FINGERPRINT_STORE);

  // Candidates: prioritize the existing protected failing slug list (so V98 keeps repairing history deterministically).
  const protectedSlugs = onlyFailing ? loadProtectedEnBlogSlugs() : new Set();
  const initialFailSet = new Set();

  if (onlyFailing && protectedSlugs.size > 0) {
    // Validate only the previously failing candidates (fast + stable).
    for (const { slug, filePath } of files) {
      if (!protectedSlugs.has(slug)) continue;
      const raw = fs.readFileSync(filePath, "utf8");
      const parsed = matter(raw);
      const body = parsed.content || "";
      const frontmatter = parsed.data || {};
      const gate = validateMdx({ slug, frontmatter, body });
      if (!gate.ok) initialFailSet.add(slug);
    }
  } else {
    // Fall back: compute failing slugs by scanning all mdx.
    for (const { slug, filePath } of files) {
      const raw = fs.readFileSync(filePath, "utf8");
      const parsed = matter(raw);
      const body = parsed.content || "";
      const frontmatter = parsed.data || {};
      const gate = validateMdx({ slug, frontmatter, body });
      if (!gate.ok) initialFailSet.add(slug);
    }
  }

  // Create/overwrite temporary protection list so failing pages are excluded immediately.
  ensureDir(EN_PROTECTED_SLUGS_OUT);
  fs.writeFileSync(EN_PROTECTED_SLUGS_OUT, JSON.stringify({ generatedAt: nowIso(), slugs: Array.from(initialFailSet) }, null, 2), "utf8");

  const candidates = onlyFailing ? Array.from(initialFailSet) : files.map((x) => x.slug);
  // Repair scope: only rewrite pages that are currently failing the quality gate.
  const repairCandidates = Array.from(initialFailSet);
  const limitedCandidates = typeof limit === "number" && Number.isFinite(limit) ? repairCandidates.slice(0, limit) : repairCandidates;

  console.log("\n=== V97 Repair EN Blog ===");
  console.log(`dryRun=${dryRun} onlyFailing=${onlyFailing} limit=${limit ?? "all"}`);
  console.log(`Total mdx files=${files.length}`);
  console.log(`Initial failing (protected)=${initialFailSet.size}`);
  console.log(`Candidates to repair=${limitedCandidates.length}`);
  console.log(`Temporary protection: ${EN_PROTECTED_SLUGS_OUT}`);
  console.log("===========================\n");

  let repaired = 0;
  let failed = 0;
  const perReasonDist = new Map();

  // Work with a mutable store to keep similarity guard consistent after each successful repair.
  let storeItems = loadFingerprintStore(FINGERPRINT_STORE);

  for (const slug of limitedCandidates) {
    const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
    if (!fs.existsSync(filePath)) continue;

    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = matter(raw);
    const frontmatter = parsed.data || {};
    const title = String(frontmatter.title || "");
    const description = String(frontmatter.description || "");

    appendJsonl(REPAIR_LOG, { at: nowIso(), action: "attempt", slug });

    if (dryRun) {
      appendJsonl(REPAIR_LOG, { at: nowIso(), action: "dry_run_skip_write", slug });
      continue;
    }

    let ok = false;
    let lastGate = null;

    // Retry once if it fails due similarity or structural reasons.
    for (let attempt = 1; attempt <= 2 && !ok; attempt++) {
      try {
        const aiBody = await generateBodyViaAI({ slug, title, description });
        const sim = computeSimilarityAgainstCorpus(String(aiBody), storeItems, { similarityMax: SIMILARITY_MAX }).bestSimilarity;
        const gate = validateMdx({
          slug,
          frontmatter,
          body: aiBody,
          similarity: sim,
          similarityMax: SIMILARITY_MAX
        });
        lastGate = gate;
        if (!gate.ok) {
          for (const r of gate.reasons) perReasonDist.set(r, (perReasonDist.get(r) ?? 0) + 1);
          appendJsonl(REPAIR_LOG, { at: nowIso(), action: "gate_failed", slug, attempt, reasons: gate.reasons, bestSimilarity: sim });
          continue;
        }

        // Passed: write file and update fingerprints.
        writeMdxFile({ filePath, frontmatterData: frontmatter, body: aiBody });
        repaired++;

        // Update fingerprint store with new hashes.
        const hashesResult = computeSimilarityAgainstCorpus(String(aiBody), [], { similarityMax: SIMILARITY_MAX });
        const existingIdx = (storeItems || []).findIndex((it) => String(it?.id || it?.slug) === String(slug));
        if (existingIdx >= 0) {
          storeItems[existingIdx] = { id: slug, slug, hashes: hashesResult.hashes };
        } else {
          storeItems = storeItems.concat([{ id: slug, slug, hashes: hashesResult.hashes }]);
        }
        saveFingerprintStore(FINGERPRINT_STORE, storeItems);

        ok = true;
        appendJsonl(REPAIR_LOG, { at: nowIso(), action: "repaired_and_written", slug, attempt });
      } catch (e) {
        lastGate = { ok: false, meta: { kind: "repair", slug }, reasons: ["openai_error"], error: String(e?.message || e) };
      }
    }

    if (!ok) {
      failed++;
      const reasons = lastGate?.reasons ?? ["unknown_failure"];
      appendJsonl(REPAIR_FAILURE_LOG, {
        at: nowIso(),
        slug,
        reasons,
        lastError: lastGate?.error
      });
      appendJsonl(REPAIR_LOG, { at: nowIso(), action: "repair_failed", slug, reasons });
    }
  }

  // Recompute remaining failing slugs after repairs to update protection list.
  const remainingFailSet = new Set();
  storeItems = loadFingerprintStore(FINGERPRINT_STORE);
  for (const { slug, filePath } of files) {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = matter(raw);
    const body = parsed.content || "";
    const frontmatter = parsed.data || {};
    const gate = validateMdx({ slug, frontmatter, body });
    if (!gate.ok) remainingFailSet.add(slug);
  }

  fs.writeFileSync(
    EN_PROTECTED_SLUGS_OUT,
    JSON.stringify({ updatedAt: nowIso(), slugs: Array.from(remainingFailSet) }, null, 2),
    "utf8"
  );

  console.log("\n=== V97 Repair Summary ===");
  console.log(`Repaired_success=${repaired} Repaired_failed=${failed}`);
  console.log(`Remaining failing after repair=${remainingFailSet.size}`);
  console.log(`Updated protection list: ${EN_PROTECTED_SLUGS_OUT}`);
  if (perReasonDist.size > 0) {
    const top = [...perReasonDist.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    console.log(`Top failure reasons during repair: ${top.map(([k, v]) => `${k}=${v}`).join(" | ")}`);
  }
  console.log("===========================\n");
}

main().catch((e) => {
  console.error("repair-en-blog failed:", e);
  process.exit(1);
});

