/**
 * SEO Blog Generator - Target 500 posts
 * Governed by docs/system-blueprint.md.
 * Do not implement logic that conflicts with blueprint rules.
 * Topics: TikTok captions ideas, TikTok hook ideas, YouTube shorts titles, Instagram caption ideas
 *
 * Usage: node scripts/generate-seo-blog.js [--dry-run] [--limit N]
 *
 * V111: After `npm run search:growth`, run `npm run content:allocation` so
 * `generated/content-allocation-plan.json` steers platform/topic/intent order + pauses weak slugs.
 * Without that file, neutral weights + full grid (diversified round-robin).
 */

const fs = require("fs");
const path = require("path");
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

const { enqueueIndexingUrl } = require("./lib/indexing-queue");
const { sanitizeAndValidateMdxForWrite } = require("./lib/mdx-safety");
const { topicKeyFromParts } = require("./lib/topic-normalizer");
const { validateBlogLike } = require("./lib/content-role-validator");
const { loadRegistry, saveRegistry, decideGeneration, upsertTopicPage } = require("./lib/topic-registry");

const {
  buildEnBlogLinkIndex,
  addEnBlogFpToLinkIndex,
  selectEnBlogRelatedPageSlugs,
  loadSearchLinkPriority,
  sortBlogSlugsForBacklinks,
  extractEnBlogTitleFromMdx,
  injectEnBlogRelatedPagesSectionIntoBody,
  upsertEnBlogRelatedPagesLink,
  computeEnRelatedToolLinksForBlogPage,
  computeEnRelatedAnswerLinksForBlogPage,
  computeEnRelatedGuideLinksForBlogPage,
  computeEnRelatedHubLinksForBlogPage,
  upsertEnBlogLinksSectionIntoBody,
  upsertEnBlogRelatedToolsSectionIntoBody
} = require("./lib/en-internal-linking");

const { loadContentAllocationPlan, buildGenerationOrder } = require("./lib/content-allocation");

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const FINGERPRINT_STORE = path.join(process.cwd(), "generated", "quality-gate", "en-blog-fingerprints.json");
const REJECTION_LOG = path.join(process.cwd(), "logs", "quality-gate-rejections.jsonl");
const OBSERVATION_LOG = path.join(process.cwd(), "logs", "seo-observation.jsonl");
const EN_PLACEHOLDER_PHRASES = ["Example 1", "Example 2", "Placeholder", "TBD", "Coming soon", "Lorem ipsum"];
const MIN_ITEM_WORDS = 6;
const ITEM_COUNTS = [50, 30, 20]; // retry plan

function containsAnyPlaceholder(text) {
  const t = String(text || "").toLowerCase();
  return EN_PLACEHOLDER_PHRASES.some((p) => t.includes(String(p).toLowerCase()));
}

function countWords(s) {
  return String(s || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function extractJsonCandidate(raw) {
  const s = String(raw || "").trim();
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) return fenced[1].trim();
  const firstBrace = s.indexOf("{");
  if (firstBrace < 0) return s;

  // Balanced brace extraction: start at first '{' and stop at the matching closing '}'.
  // This avoids grabbing trailing braces from extra commentary.
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = firstBrace; i < s.length; i++) {
    const ch = s[i];
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === "\"") {
        inString = false;
      }
      continue;
    }

    if (ch === "\"") {
      inString = true;
      continue;
    }

    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) return s.slice(firstBrace, i + 1);
    }
  }

  // Fallback: return the substring up to the last brace.
  const lastBrace = s.lastIndexOf("}");
  if (lastBrace > firstBrace) return s.slice(firstBrace, lastBrace + 1);
  return s;
}

function repairCommonJsonIssues(jsonStr) {
  let s = String(jsonStr || "");

  // Fix the most common failure we saw: hashtags returned as bare tokens (#tag)
  // instead of JSON strings ("#tag").
  s = s.replace(/("hashtags"\s*:\s*\[)([\s\S]*?)(\])/g, (m, start, inner, end) => {
    const fixedInner = inner.replace(/(^|[\s,])#([A-Za-z0-9_-]+)/g, (mm, prefix, tag) => {
      return `${prefix}"#${tag}"`;
    });
    return `${start}${fixedInner}${end}`;
  });

  // Quote unquoted keys: { title: "x" } => { "title": "x" }
  s = s.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":');

  // Fix single-quoted strings after ':' or ',' (best-effort).
  s = s.replace(/(:|,)\s*'([^']*)'/g, '$1 "$2"');

  // Remove trailing commas again (best-effort).
  s = s.replace(/,\s*([}\]])/g, "$1");

  return s;
}

function readRealPublishObservations(observationLogPath) {
  try {
    if (!fs.existsSync(observationLogPath)) return [];
    const lines = fs.readFileSync(observationLogPath, "utf8").trim().split(/\n+/).filter(Boolean);
    const entries = lines.map((l) => JSON.parse(l));
    return entries.filter((e) => e?.mode === "real_publish");
  } catch {
    return [];
  }
}

function computeScalingRecommendationFromObservations(observations) {
  const last5 = observations.slice(-5);
  const last3 = observations.slice(-3);
  const latest = observations[observations.length - 1];
  const latestRejectionRate = latest?.rejectionRate ?? 0;

  // Strict batch-count gates per V101.
  const has3 = last3.length === 3;
  const has5 = last5.length === 5;

  if (latestRejectionRate > 0.20) {
    return { recommendedDailyLimit: 0, rule: "pause", stability: "unstable" };
  }
  if (latestRejectionRate > 0.10) {
    return { recommendedDailyLimit: 10, rule: "fallback_10", stability: "unstable" };
  }
  if (has5 && last5.every((e) => (e.rejectionRate ?? 0) < 0.03)) {
    return { recommendedDailyLimit: 25, rule: "increase_25_30", stability: "stable" };
  }
  if (has3 && last3.every((e) => (e.rejectionRate ?? 0) < 0.05)) {
    return { recommendedDailyLimit: 20, rule: "increase_20", stability: "stable" };
  }
  return { recommendedDailyLimit: 10, rule: "hold_10", stability: "unstable" };
}

function tryParseJson(raw) {
  const candidate = extractJsonCandidate(raw);
  const candidates = [
    candidate,
    candidate.replace(/,\s*([}\]])/g, "$1"),
    repairCommonJsonIssues(candidate),
    repairCommonJsonIssues(candidate.replace(/,\s*([}\]])/g, "$1"))
  ];
  let lastErr = null;
  for (const c of candidates.filter(Boolean)) {
    try {
      return JSON.parse(c);
    } catch {
      // keep trying
    }
  }
  // Last attempt details for debugging; keep short to avoid log spam.
  const preview = String(candidates?.[0] ?? "").slice(0, 220).replace(/\s+/g, " ");
  throw new Error(`Invalid JSON (unable to parse). preview=${preview}`);
}

const PLATFORMS = ["tiktok", "youtube", "instagram"];
const CONTENT_TYPES = ["captions", "hashtags", "titles", "hooks"];
const TOPICS = [
  "funny", "aesthetic", "savage", "cute", "attitude", "love", "sad", "selfie", "travel", "fitness",
  "gym", "gaming", "food", "friends", "motivation", "inspirational", "sarcastic", "sassy", "romantic",
  "confidence", "self-love", "lifestyle", "pet", "music", "tech", "cooking", "skincare", "makeup",
  "hair", "ootd", "unboxing", "review", "tutorial", "tips", "hacks", "life-hack", "productivity",
  "study", "work-from-home", "small-business", "entrepreneur", "mom-life", "dad", "family",
  "wedding", "vacation", "adventure", "nature", "sunset", "coffee", "y2k", "cottagecore",
  "minimalist", "edgy", "baddie", "clean-girl", "that-girl", "grwm", "day-in-my-life", "storytime",
  "duet", "stitch", "trending-sound", "challenge", "before-after", "get-ready-with-me", "vlog",
  "comedy", "relatable", "transformation", "dance", "education", "niche", "viral", "trending",
  "best", "short", "long", "pov", "story", "opening", "first-line", "curiosity", "question",
  "controversial", "secret", "mystery", "clickbait", "views", "engagement", "beginners", "advanced",
  "gaming-video", "lets-play", "walkthrough", "prank", "reaction", "how-to",
  "diy", "business", "finance", "asmr", "cover", "comparison", "vs", "top-10", "list",
  "brand", "product", "promotion", "launch", "testimonial", "behind-the-scenes", "team", "event",
  "collab", "giveaway", "contest", "sale", "new-arrival", "recipe", "restaurant", "yoga",
  "running", "aesthetic-reel", "trending-reel", "dance-reel", "tutorial-reel",
  "comedy-reel", "niche-hashtags", "fitness-hashtags", "fashion-hashtags", "food-hashtags",
  "travel-hashtags", "beauty-hashtags", "business-hashtags", "small-business-hashtags", "brand-hashtags",
  "creative-usernames", "aesthetic-usernames", "funny-usernames", "cute-usernames",
  "script", "script-template", "script-structure", "video-ideas", "content-ideas",
  "ideas-for-beginners", "viral-ideas", "trending-ideas", "fitness-ideas", "beauty-ideas",
  "food-ideas", "travel-ideas", "gaming-ideas", "education-ideas", "dance-ideas", "comedy-ideas",
  "storytime-ideas", "duet-ideas", "stitch-ideas", "challenge-ideas", "trending-sounds-ideas",
  "best-hashtags", "viral-hashtags", "fitness-hashtags", "beauty-hashtags", "dance-hashtags",
  "comedy-hashtags", "caption-ideas", "caption-for-views", "caption-for-reels", "caption-for-selfies",
  "caption-for-business", "reel-captions", "title-examples", "title-formulas", "title-for-views",
  "shorts-titles", "intro-hooks", "hook-examples", "bio-ideas", "bio-examples"
];

const TOOL_MAP = {
  tiktok_captions: "tiktok-caption-generator",
  tiktok_hashtags: "hashtag-generator",
  tiktok_titles: "title-generator",
  tiktok_hooks: "hook-generator",
  youtube_captions: "tiktok-caption-generator",
  youtube_hashtags: "hashtag-generator",
  youtube_titles: "youtube-title-generator",
  youtube_hooks: "hook-generator",
  instagram_captions: "instagram-caption-generator",
  instagram_hashtags: "hashtag-generator",
  instagram_titles: "title-generator",
  instagram_hooks: "hook-generator"
};

function formatLabel(s) {
  return s.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function getToolSlug(platform, contentType) {
  return TOOL_MAP[`${platform}_${contentType}`] || "tiktok-caption-generator";
}

function getTypeLabel(type) {
  const labels = { captions: "Captions", hashtags: "Hashtags", titles: "Titles", hooks: "Hooks" };
  return labels[type] || type;
}

function getPlatformLabel(p) {
  const labels = { tiktok: "TikTok", youtube: "YouTube", instagram: "Instagram" };
  return labels[p] || p;
}

function generateSlug(platform, contentType, topic) {
  return `${platform}-${contentType}-${topic}`;
}

function pageTypeKey(platform, contentType) {
  return `${platform}_${contentType}`;
}

function internalResourceLinks(platform, contentType) {
  const platformLabel = getPlatformLabel(platform);
  const typeLabel = getTypeLabel(contentType);
  // Keep it safe: link to stable hubs + at least one internal /blog/* slug (existing MDX pool).
  const primary = [
    { href: `/${platform}-tools`, label: `${platformLabel} tools hub` },
    { href: "/tools", label: "All tools" },
    { href: "/en/how-to", label: "Creator guides" },
    { href: "/learn-ai", label: "Learn AI (prompts & workflows)" }
  ];
  // Curated blog slugs (already exist in repo) — do not overfit.
  const blog = {
    captions: [
      { href: "/blog/best-tiktok-captions-for-views", label: `Caption examples that work` },
      { href: "/blog/how-to-write-viral-hooks", label: "How to write hooks" }
    ],
    hooks: [
      { href: "/blog/viral-tiktok-hooks", label: "Viral hook patterns" },
      { href: "/blog/how-to-write-tiktok-hooks", label: "Hook writing guide" }
    ],
    hashtags: [
      { href: "/blog/best-hashtags-for-reels", label: "Hashtag strategy" },
      { href: "/blog/instagram-reel-hashtag-strategy", label: "Reels hashtag tactics" }
    ],
    titles: [
      { href: "/blog/youtube-title-formulas", label: "YouTube title formulas" },
      { href: "/blog/best-youtube-titles-for-views", label: "High CTR title examples" }
    ]
  };
  const picks = blog[contentType] || blog.captions;
  const blended = [...picks, ...primary];
  return blended.slice(0, 5).map((l) => ({ ...l, label: l.label || `${platformLabel} ${typeLabel}` }));
}

async function generateListicleViaAI({
  platform,
  contentType,
  topic,
  platformLabel,
  typeLabel,
  toolSlug,
  apiKey,
  itemCount,
  strictStructure
}) {
  const topicLabel = formatLabel(topic);
  const resourceLinks = internalResourceLinks(platform, contentType);
  const desiredCount = Number.isFinite(itemCount) ? itemCount : 50;

  // Enforce publish-ready narrative + real, usable list items.
  const prompt = `You write for short-form creators. Generate an English blog page as JSON.

Topic: ${topicLabel}
Platform: ${platformLabel}
Content type: ${typeLabel}
Primary tool: /tools/${toolSlug}

Hard requirements:
- FORBID placeholders: "${EN_PLACEHOLDER_PHRASES.join('", "')}" (do not output them anywhere).
- Must deliver EXACTLY ${desiredCount} usable items under "items" (each item MUST be a string with ${MIN_ITEM_WORDS}+ words; concrete + niche-aware).
- Must include a "packageFraming" object describing: hook, scriptBeats, captionOrTitle, cta, hashtags, whyItWorks.
- Must include BOTH internal link blocks:
  1) relatedTools: include at least one "/tools/*" href (must be JSON strings)
  2) relatedResources: include at least one internal href containing "/blog/" or "/learn-ai" or "/en/how-to" (must be JSON strings)
- Keep tone advisory (no guaranteed results).

JSON output rules (critical):
- JSON ONLY. No commentary. No extra keys.
- You may wrap the JSON in a single code fence (json language tag).
- Do NOT include any raw newline characters inside quoted string values (each string must be single-line).
- Keep the JSON object compact; avoid long, formatted paragraphs inside values.
- No trailing commas.
- Every JSON value must be valid JSON: strings in double quotes, arrays in [].
- hashtags must be an array of strings, each string starts with "#". NEVER output bare tokens.

Return JSON (exact schema):
{
  "title": "string",
  "description": "string",
  "items": ["item1...", "item2...", "... EXACTLY ${desiredCount} STRINGS ..."],
  "bestFor": ["3 strings"],
  "conclusion": "string",
  "packageFraming": {
    "hook": "string",
    "scriptBeats": ["3-5 bullets"],
    "captionOrTitle": "string",
    "cta": "string",
    "hashtags": ["8-14 hashtags (each starts with #)"],
    "whyItWorks": ["2-4 bullets"]
  },
  "relatedTools": [{"href":"/tools/${toolSlug}","label":"..."},{"href":"/tools/hook-generator","label":"..."}],
  "relatedResources": ${JSON.stringify(resourceLinks)}
}`;

  const systemAddon = strictStructure
    ? `Strict mode: output must be exactly valid JSON for JSON.parse. Output the entire JSON object on one line. No raw newlines inside strings. If you cannot comply, output shorter single-line strings but keep the schema intact.`
    : ``;

  const content = await openaiChatCompletions(
    {
      model: getModel(),
      messages: [
        { role: "system", content: "You output JSON only." },
        { role: "user", content: systemAddon ? `${prompt}\n\n${systemAddon}` : prompt }
      ],
      temperature: strictStructure ? 0.15 : 0.4,
      max_tokens: 2600
    },
    apiKey
  );

  const parsed = tryParseJson(content);
  if (!parsed || typeof parsed !== "object") throw new Error("Parsed JSON is not an object.");

  const items = Array.isArray(parsed.items) ? parsed.items : [];
  if (items.length !== desiredCount) throw new Error(`Under/over-generation: items=${items.length}, expected=${desiredCount}`);
  for (const it of items) {
    const w = countWords(String(it || ""));
    if (w < MIN_ITEM_WORDS) throw new Error(`Item too short: words=${w}, min=${MIN_ITEM_WORDS}`);
  }

  const pf = parsed.packageFraming || {};
  const hashtags = Array.isArray(pf.hashtags) ? pf.hashtags : [];
  if (!Array.isArray(hashtags) || hashtags.length < 6) throw new Error("Hashtags missing/too short");

  if (containsAnyPlaceholder([parsed.title, parsed.description, ...items, pf.hook, pf.captionOrTitle, pf.cta, pf.whyItWorks].join("\n"))) {
    throw new Error("Placeholder phrase detected in generation");
  }

  const bodyLines = [];
  bodyLines.push(
    `Turn one idea into a publish-ready content package: hook, script beats, caption/title, CTA, hashtags, and why it works. Then pick one variant and ship.`
  );
  bodyLines.push("");
  bodyLines.push(`Generate more with the [${platformLabel} ${typeLabel} Generator](/tools/${toolSlug}).`);
  bodyLines.push("");
  bodyLines.push(`## ${topicLabel} ${typeLabel}`);
  bodyLines.push("");
  items.forEach((it, i) => bodyLines.push(`${i + 1}. ${String(it || "").trim()}`));
  bodyLines.push("");
  bodyLines.push(`## Publish-ready package framing (what to paste)`);
  bodyLines.push("");
  bodyLines.push(`### Hook`);
  bodyLines.push(String(pf.hook || "").trim() || "Use a specific promise + a curiosity gap in the first line.");
  bodyLines.push("");
  bodyLines.push(`### Script beats`);
  const beats = Array.isArray(pf.scriptBeats) ? pf.scriptBeats : [];
  if (beats.length > 0) {
    beats.slice(0, 6).forEach((b) => bodyLines.push(`- ${String(b || "").trim()}`));
  } else {
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
  const tags = Array.isArray(pf.hashtags) ? pf.hashtags : [];
  if (tags.length > 0) bodyLines.push(tags.slice(0, 16).join(" "));
  else bodyLines.push("#creators #shortformvideo #contentstrategy #tiktoktips");
  bodyLines.push("");
  bodyLines.push(`### Why it works`);
  const why = Array.isArray(pf.whyItWorks) ? pf.whyItWorks : [];
  if (why.length > 0) why.slice(0, 6).forEach((w) => bodyLines.push(`- ${String(w || "").trim()}`));
  else bodyLines.push("- Specificity beats generic inspiration on sound-on feeds.");
  bodyLines.push("");
  bodyLines.push(`## Best for ${platformLabel}`);
  bodyLines.push("");
  const bestFor = Array.isArray(parsed.bestFor) ? parsed.bestFor : [];
  bestFor.slice(0, 6).forEach((b, i) => bodyLines.push(`${i + 1}. ${String(b || "").trim()}`));
  if (bestFor.length === 0) {
    bodyLines.push("1. Creators who want fast, usable drafts");
    bodyLines.push("2. Niches that need quick examples");
    bodyLines.push("3. Weekly posting schedules that need volume");
  }
  bodyLines.push("");
  bodyLines.push("## Related tools");
  bodyLines.push("");
  const rt = Array.isArray(parsed.relatedTools) ? parsed.relatedTools : [];
  const toolLinks = rt.length > 0 ? rt : [{ href: `/tools/${toolSlug}`, label: `${platformLabel} ${typeLabel} Generator` }];
  toolLinks.slice(0, 4).forEach((l) => bodyLines.push(`- [${l.label || l.href}](${l.href})`));
  bodyLines.push("");
  bodyLines.push("## Related resources");
  bodyLines.push("");
  const rr = Array.isArray(parsed.relatedResources) ? parsed.relatedResources : resourceLinks;
  rr.slice(0, 6).forEach((l) => bodyLines.push(`- [${l.label || l.href}](${l.href})`));
  bodyLines.push("");
  bodyLines.push("## Summary");
  bodyLines.push("");
  bodyLines.push(String(parsed.conclusion || "").trim() || `Pick 1 idea → choose 1 package framing → paste into your post → ship. Generate more with [${platformLabel} ${typeLabel} Generator](/tools/${toolSlug}).`);

  const sections = [
    { id: `${topic}-items`, title: `${topicLabel} ${typeLabel}` },
    { id: `${topic}-package`, title: "Publish-ready package framing" },
    { id: `${topic}-tools`, title: "Related tools" },
    { id: `${topic}-resources`, title: "Related resources" }
  ];

  const safeTitle =
    typeof parsed.title === "string" && parsed.title.trim()
      ? parsed.title.trim()
      : `${desiredCount} ${topicLabel} ${platformLabel} ${typeLabel.replace(/s$/, "")} Ideas (2026)`;
  const safeDesc =
    typeof parsed.description === "string" && parsed.description.trim()
      ? parsed.description.trim()
      : `${desiredCount} ${topicLabel} ${platformLabel} ${typeLabel.toLowerCase()} you can copy-paste. Plus a publish-ready package framing (hook, beats, caption/title, CTA, hashtags).`;

  return {
    title: safeTitle,
    description: safeDesc,
    slug: generateSlug(platform, contentType, topic),
    tags: [platform, contentType, topic],
    toc: sections,
    recommendedTools: [toolSlug],
    body: bodyLines.join("\n")
  };
}

function buildMdx(data) {
  const tocYaml = data.toc.map(t => `  - { title: "${t.title}", id: "${t.id}" }`).join("\n");
  return `---
title: "${data.title.replace(/"/g, '\\"')}"
description: "${data.description.replace(/"/g, '\\"')}"
date: "${new Date().toISOString().slice(0, 10)}"
tags:
${data.tags.map(t => `  - ${t}`).join("\n")}
slug: "${data.slug}"
toc:
${tocYaml}
recommendedTools:
  - ${data.recommendedTools[0]}
---

${data.body}
`;
}

function loadExistingMdxSlugs() {
  if (!fs.existsSync(BLOG_DIR)) return new Set();
  return new Set(
    fs
      .readdirSync(BLOG_DIR)
      .filter((f) => f.endsWith(".mdx"))
      .map((f) => f.replace(".mdx", ""))
  );
}

async function main() {
  const args = process.argv.slice(2);
  const { isSeoDryRun, pathInSandbox } = require("./lib/seo-sandbox-context");
  const dryRun = args.includes("--dry-run") || isSeoDryRun();
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : 50;
  const attemptLimitIdx = args.indexOf("--attempt-limit");
  const attemptLimit =
    attemptLimitIdx >= 0 ? parseInt(args[attemptLimitIdx + 1], 10) : undefined;
  const dateISO = new Date().toISOString().slice(0, 10);
  const observationLog = dryRun ? pathInSandbox(process.cwd(), "seo-observation.jsonl") : OBSERVATION_LOG;

  if (!fs.existsSync(BLOG_DIR)) {
    fs.mkdirSync(BLOG_DIR, { recursive: true });
  }

  const existing = loadExistingMdxSlugs();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY required for publish-ready SEO generation (V96 quality gate).");
    process.exit(1);
  }

  const { pickSeoChatConfig } = require("./lib/seo-model-router-v153");
  const { logV153SeoGeneration } = require("./lib/seo-telemetry-v153");
  const { appendHighQualityAsset, mergeRetrievalStats } = require("./lib/seo-hq-assets-store");
  const v153BlogCfg = pickSeoChatConfig({ bulk: true });
  logV153SeoGeneration({
    retrieval_used: false,
    generation_mode: "ai",
    model_cost_tier: v153BlogCfg.model_cost_tier || "medium",
    slug: "en:seo-blog-batch",
    keyword: `batch_limit=${limit}`
  });

  const corpus = loadFingerprintStore(FINGERPRINT_STORE);
  const linkIndex = buildEnBlogLinkIndex(corpus);
  const searchLink = loadSearchLinkPriority();
  const allocationPlan = loadContentAllocationPlan();
  const generationOrder = buildGenerationOrder(PLATFORMS, CONTENT_TYPES, TOPICS, allocationPlan);
  const pausedCount =
    PLATFORMS.length * CONTENT_TYPES.length * TOPICS.length - generationOrder.length;
  console.log(
    `[V111] content allocation: order=${generationOrder.length} combos (paused/skipped ${pausedCount} exact slugs). Run build-content-allocation-plan.js after search:growth.`
  );
  const titleCache = new Map();
  function getEnBlogTitleCached(slug) {
    if (titleCache.has(slug)) return titleCache.get(slug);
    const p = path.join(BLOG_DIR, `${slug}.mdx`);
    if (!fs.existsSync(p)) {
      titleCache.set(slug, slug);
      return slug;
    }
    const mdx = fs.readFileSync(p, "utf8");
    const t = extractEnBlogTitleFromMdx(mdx) || slug;
    titleCache.set(slug, t);
    return t;
  }
  let generated = 0;
  let skipped = 0;
  let rejected = 0;
  let skippedDueToConflict = 0;
  let attempts = 0; // counts non-existing slugs we actually tried
  const rejectionReasonDist = new Map();
  const retryDistribution = {
    "0_retries": 0,
    "1_retry": 0,
    "2_retries": 0,
    failed: 0
  };
  const failureByTopic = new Map();
  const topicRegistry = loadRegistry();

  for (const row of generationOrder) {
    const { platform, contentType, topic } = row;
    if ((limit && generated >= limit) || (attemptLimit && attempts >= attemptLimit)) break;

        const slug = generateSlug(platform, contentType, topic);
        if (existing.has(slug)) {
          skipped++;
          continue;
        }
        const topicKey = topicKeyFromParts({ platform, topic, slug });
        const intent = /how-to|workflow/i.test(topic) ? "how-to/workflow" : "ideas/examples/list";
        const preDecision = decideGeneration({
          registry: topicRegistry,
          topicKey,
          platform,
          type: "blog",
          url: `/blog/${slug}`,
          intent
        });
        if (preDecision.decision === "skip") {
          skipped++;
          skippedDueToConflict += 1;
          rejectionReasonDist.set(`pre_generation_skip_${preDecision.reason}`, (rejectionReasonDist.get(`pre_generation_skip_${preDecision.reason}`) ?? 0) + 1);
          continue;
        }
        attempts++;

        const platformLabel = getPlatformLabel(platform);
        const typeLabel = getTypeLabel(contentType);
        const toolSlug = getToolSlug(platform, contentType);
        let data = null;
        let sim = null;
        let gate = null;

        let lastError = null;
        let lastGate = null;

        // Auto-retry: 50 -> 30 -> 20 items
        let succeededAttemptIdx = null;
        for (let attemptIdx = 0; attemptIdx < ITEM_COUNTS.length; attemptIdx++) {
          const desiredCount = ITEM_COUNTS[attemptIdx];
          const strictStructure = attemptIdx > 0;
          try {
            data = await generateListicleViaAI({
              platform,
              contentType,
              topic,
              platformLabel,
              typeLabel,
              toolSlug,
              apiKey,
              itemCount: desiredCount,
              strictStructure
            });

            sim = computeSimilarityAgainstCorpus(data.body, corpus, { similarityMax: 0.92 });
            gate = validateEnBlogMdx({
              slug,
              title: data.title,
              description: data.description,
              body: data.body,
              recommendedTools: data.recommendedTools,
              similarity: sim.bestSimilarity
            });

            if (gate.ok) {
              const roleOk = validateBlogLike(data.body, data.title);
              if (!roleOk.ok) {
                gate = {
                  ...gate,
                  ok: false,
                  reasons: [...(Array.isArray(gate.reasons) ? gate.reasons : []), roleOk.reason]
                };
                lastGate = { gate, sim };
                data = null;
                sim = null;
                continue;
              }
              succeededAttemptIdx = attemptIdx;
              lastGate = null;
              lastError = null;
              break;
            }

            lastGate = { gate, sim };
          } catch (e) {
            lastError = e;
          } finally {
            if (lastGate && attemptIdx < ITEM_COUNTS.length - 1) {
              // continue retrying
            }
          }
          data = null;
          sim = null;
          gate = null;
        }

        if (!data || !sim || !gate || !gate.ok) {
          rejected++;
          retryDistribution.failed += 1;
          failureByTopic.set(topic, (failureByTopic.get(topic) ?? 0) + 1);
          if (lastGate?.gate?.reasons?.length) {
            for (const r of lastGate.gate.reasons) rejectionReasonDist.set(r, (rejectionReasonDist.get(r) ?? 0) + 1);
            writeRejectionLog(
              {
                at: nowIso(),
                ...lastGate.gate.meta,
                reasons: lastGate.gate.reasons,
                bestSimilarity: lastGate.sim.bestSimilarity,
                bestMatchId: lastGate.sim.bestMatchId,
                reason: "quality_gate_failed_after_retries"
              },
              REJECTION_LOG
            );
          } else {
            const msg = lastError?.message || String(lastError || "unknown");
            rejectionReasonDist.set("openai_generation_failed_after_retries", (rejectionReasonDist.get("openai_generation_failed_after_retries") ?? 0) + 1);
            writeRejectionLog(
              {
                at: nowIso(),
                kind: "en_blog_mdx",
                slug,
                reason: "openai_generation_failed_after_retries",
                message: msg
              },
              REJECTION_LOG
            );
          }
          continue;
        }

        // succeeded
        if (succeededAttemptIdx === 0) retryDistribution["0_retries"] += 1;
        if (succeededAttemptIdx === 1) retryDistribution["1_retry"] += 1;
        if (succeededAttemptIdx === 2) retryDistribution["2_retries"] += 1;

        // V104: inject semantic internal links ("Related pages") into every EN blog page,
        // then propagate the new page into a few existing pages.
        const relatedPageSlugs = selectEnBlogRelatedPageSlugs({
          index: linkIndex,
          platform,
          contentType,
          topic,
          newSlug: slug,
          newHashes: sim.hashes,
          desiredMin: 3,
          desiredMax: 10,
          desiredCount: 8,
          linkPriority: searchLink
        });

        const relatedPageLinks = relatedPageSlugs.map((s) => ({
          slug: s,
          title: getEnBlogTitleCached(s)
        }));

        // V105: cross-layer linking (tools/answers/guides/hubs) + blog-to-blog "Related pages".
        const relatedToolLinks = computeEnRelatedToolLinksForBlogPage({ platform, contentType });
        data.body = upsertEnBlogRelatedToolsSectionIntoBody(data.body, relatedToolLinks, { maxLinks: 3 });

        const relatedAnswerLinks = computeEnRelatedAnswerLinksForBlogPage({ platform, contentType });
        data.body = upsertEnBlogLinksSectionIntoBody(data.body, "## Related answers", relatedAnswerLinks, { minLinks: 1, maxLinks: 3 });

        const relatedGuideLinks = computeEnRelatedGuideLinksForBlogPage({ platform, contentType });
        data.body = upsertEnBlogLinksSectionIntoBody(data.body, "## Related guides", relatedGuideLinks, { minLinks: 1, maxLinks: 3 });

        const relatedHubLinks = computeEnRelatedHubLinksForBlogPage(platform);
        data.body = upsertEnBlogLinksSectionIntoBody(data.body, "## Related hubs", relatedHubLinks, { minLinks: 1, maxLinks: 1 });

        data.body = injectEnBlogRelatedPagesSectionIntoBody(data.body, relatedPageLinks, { minLinks: 3, maxLinks: 10 });

        corpus.push({ id: slug, slug, hashes: sim.hashes });
        addEnBlogFpToLinkIndex(linkIndex, { id: slug, slug, hashes: sim.hashes });

        const mdx = buildMdx(data);
        const filePath = path.join(BLOG_DIR, `${slug}.mdx`);

        if (!dryRun) {
          const res = sanitizeAndValidateMdxForWrite({
            mdxString: mdx,
            filePath,
            slug,
            failureKind: "en_blog_write_generate_seo_blog_mdx_compile_check"
          });
          if (res.ok) {
            fs.writeFileSync(filePath, res.sanitizedMdx, "utf8");
            upsertTopicPage({
              registry: topicRegistry,
              topicKey,
              platform,
              type: "blog",
              url: `/blog/${slug}`,
              primaryType: "blog",
              primaryUrl: `/blog/${slug}`
            });
            try {
              const structure = String(data.body || "").slice(0, 2000);
              const qs = Math.min(0.99, 0.58 + (1 - Math.min(sim.bestSimilarity, 0.99)) * 0.36);
              appendHighQualityAsset(process.cwd(), {
                topic: String(topic),
                workflow: String(platform),
                page_type: "en_blog_mdx",
                content_summary: String(data.description || "").slice(0, 1200),
                quality_score: qs,
                title: data.title,
                structure
              });
              mergeRetrievalStats(process.cwd(), { ai_delta: 1 });
            } catch (e) {
              console.warn("[hq-assets]", e?.message || e);
            }
            try {
              const base = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.tooleagle.com").replace(
                /\/$/,
                ""
              );
              enqueueIndexingUrl({ url: `${base}/blog/${slug}`, source: "generate-seo-blog" });
            } catch (e) {
              console.warn("[indexing-queue] enqueue failed:", e?.message || e);
            }
          } else {
            console.warn(`[mdx-safety] skip write (compile failed): slug=${slug}`);
          }
        }

        if (!dryRun) {
          // Backlink propagation: update 3–5 existing related pages.
          const backlinkTargets = sortBlogSlugsForBacklinks(
            relatedPageSlugs,
            searchLink.prioritySet,
            searchLink.weakSet
          ).slice(0, 5);
          if (backlinkTargets.length >= 3) {
            backlinkTargets.forEach((targetSlug) => {
              upsertEnBlogRelatedPagesLink({
                blogDir: BLOG_DIR,
                targetSlug,
                newSlug: slug,
                newTitle: data.title,
                maxLinks: 10
              });
            });
          }
        }

    generated++;
    if (dryRun) console.log(`[dry-run] Would create: ${slug}.mdx`);
    if (limit && generated >= limit) break;
    if (attemptLimit && attempts >= attemptLimit) break;
  }

  if (!dryRun) {
    saveFingerprintStore(FINGERPRINT_STORE, corpus);
    saveRegistry(topicRegistry);
  }

  const totalAttempts = generated + rejected;
  const rejectionRate = totalAttempts > 0 ? rejected / totalAttempts : 0;
  const topReasons = [...rejectionReasonDist.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topRejectionReasons = topReasons.map(([reason, count]) => ({ reason, count }));
  const avgRetriesPerSuccess =
    generated > 0 ? (0 * retryDistribution["0_retries"] + 1 * retryDistribution["1_retry"] + 2 * retryDistribution["2_retries"]) / generated : 0;

  console.log(
    `SEO Blog Generator (V96 gate + retry): ${generated} created, ${rejected} rejected, ${skipped} skipped, attempts=${totalAttempts} (rejectionRate=${(rejectionRate * 100).toFixed(1)}%)`
  );
  if (topReasons.length > 0) {
    console.log(`Top rejection reasons: ${topReasons.map(([k, v]) => `${k}=${v}`).join(" | ")}`);
  }

  // Observation snapshot for growth decisions.
  try {
    const snapshot = {
      timestamp: nowIso(),
      mode: dryRun ? "dry-run" : "real_publish",
      attempted: totalAttempts,
      created: generated,
      rejected,
      rejectionRate,
      retryDistribution,
      avgRetriesPerSuccess,
      failureByTopic: Object.fromEntries([...failureByTopic.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0])))),
      skippedDueToConflict,
      topRejectionReasons
    };
    fs.mkdirSync(path.dirname(observationLog), { recursive: true });
    fs.appendFileSync(observationLog, JSON.stringify(snapshot) + "\n", "utf8");
  } catch (e) {
    console.warn("[seo-observation] skipped:", e?.message || String(e));
  }

  // Auto-scaling recommendation (does NOT trigger generation volume changes here).
  try {
    const observations = readRealPublishObservations(observationLog);
    const rec = computeScalingRecommendationFromObservations(observations);
    console.log(
      `[auto-scaling][EN blog] recommendedDailyLimit=${rec.recommendedDailyLimit}/day (rule=${rec.rule}, stability=${rec.stability})`
    );
  } catch (e) {
    console.warn("[auto-scaling] skipped:", e?.message || String(e));
  }

  if (dryRun) {
    console.log("(dry-run: no files written)");
  } else {
    // Daily SEO ledger (auto, no manual bookkeeping).
    try {
      const { recordSeoLedger } = require("./seo-ledger");
      recordSeoLedger({ dateISO, reason: `en:generate-seo-blog limit=${limit}` });
    } catch (e) {
      console.warn("[seo-ledger] skipped:", e?.message || String(e));
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
