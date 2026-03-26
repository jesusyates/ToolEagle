#!/usr/bin/env node
/**
 * V112 — Page-aware optimization recommendations (no LLM; heuristic + current MDX)
 *
 * Usage: node scripts/build-page-optimization-recommendations.js
 */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const {
  BLOG_DIR,
  safeReadJson,
  extractIntroFromBody,
  wordCount
} = require("./lib/page-optimization-shared");

const CANDIDATES_PATH = path.join(process.cwd(), "generated", "page-optimization-candidates.json");
const OUT = path.join(process.cwd(), "generated", "page-optimization-recommendations.json");

function platformHint(slug) {
  if (slug.startsWith("tiktok-")) return "TikTok";
  if (slug.startsWith("youtube-")) return "YouTube";
  if (slug.startsWith("instagram-")) return "Instagram";
  return "short-form";
}

function clampDescription(s, minLen = 120, maxLen = 165) {
  let t = String(s || "").replace(/\s+/g, " ").trim();
  if (t.length >= minLen && t.length <= maxLen) return t;
  if (t.length > maxLen) return t.slice(0, maxLen - 1).trim() + "…";
  while (t.length < minLen) t += " Actionable examples + free tools.";
  return t.slice(0, maxLen);
}

function sharpenIntroSuggestion(slug, intro, bucket, ctr) {
  const plat = platformHint(slug);
  const wc = wordCount(intro);
  const issues = [];
  if (wc < 35) issues.push(`Intro is short (${wc} words); add one concrete outcome sentence for ${plat} creators.`);
  if (ctr < 0.025) issues.push("Low CTR: lead with a specific promise (save time / get views / copy-paste lines) in sentence 1.");
  if (bucket === "high_potential") issues.push("High impressions: match title intent in the first line (same keywords, clearer benefit).");
  if (!issues.length) issues.push("Tighten first sentence: state who it's for + what they get + link to the generator below.");
  return issues.join(" ");
}

function titleSuggestion(title, slug, bucket, ctr) {
  const t = String(title || "").trim();
  const len = t.length;
  const out = [];
  if (len > 62) out.push(`SERP trim risk (${len} chars): shorten to ~55–60; keep primary keywords from slug: ${slug.replace(/-/g, " ")}.`);
  if (len < 28) out.push(`Title is short: add one specificity (audience or outcome) without keyword stuffing.`);
  if (ctr < 0.02 && bucket === "high_potential") out.push("CTR bottleneck: test a clearer outcome in the title (numbers or 'for creators' angle).");
  if (!/\b(20\d{2})\b/.test(t) && /ideas|captions|hooks|titles|hashtags/i.test(t))
    out.push("Optional: add year only if content is refreshed for current tactics.");
  if (!out.length) out.push("Minor: ensure primary topic appears in first 40 characters.");
  return out.join(" ");
}

function buildRecommendations(candidate, mdxPath) {
  const { slug, bucket, ctr, impressions, position, priorityReason, growthScore } = candidate;
  if (!fs.existsSync(mdxPath)) {
    return {
      slug,
      bucket,
      status: "missing_file",
      note: `No MDX at ${mdxPath}`,
      recommendations: null
    };
  }

  const raw = fs.readFileSync(mdxPath, "utf8");
  const { data, content } = matter(raw);
  const title = data.title || "";
  const description = data.description || "";
  const intro = extractIntroFromBody(content);
  const tools = Array.isArray(data.recommendedTools) ? data.recommendedTools : [];

  const primaryTool = tools[0] ? `/tools/${tools[0]}` : "/tools/tiktok-caption-generator";
  const plat = platformHint(slug);

  const metaIssues = [];
  const dlen = String(description).replace(/\s+/g, " ").trim().length;
  if (dlen < 110) metaIssues.push(`Meta is thin (${dlen} chars); expand to ~140–160 with benefit + CTA.`);
  if (dlen > 170) metaIssues.push(`Meta may truncate (${dlen} chars); front-load benefit in first 120 chars.`);

  const relatedLinks = [];
  if (tools.length) {
    relatedLinks.push({
      href: primaryTool,
      label: "Primary tool CTA",
      reason: "Align snippet intent with the main generator users should try"
    });
  }
  relatedLinks.push({
    href: "/blog/best-tiktok-captions-for-views",
    label: "Internal proof / examples hub (swap if closer topic exists manually)",
    reason: "Cross-link a high-trust related article if topic matches"
  });

  const safeApply = {
    description: clampDescription(
      description ||
        `${plat} ideas and copy-paste examples. Free generator + practical tips for creators.`,
      120,
      165
    )
  };

  return {
    slug,
    bucket,
    impressions,
    clicks: candidate.clicks,
    ctr,
    position,
    priorityReason,
    growthScore,
    current: {
      title,
      description: String(description).trim(),
      introPreview: intro.slice(0, 320) + (intro.length > 320 ? "…" : ""),
      introWordCount: wordCount(intro),
      recommendedTools: tools
    },
    recommendations: {
      titleImprovement: titleSuggestion(title, slug, bucket, ctr),
      metaDescriptionImprovement: metaIssues.length
        ? metaIssues.join(" ")
        : "Tighten first clause to match search intent; keep CTA to tools in the second sentence.",
      introSharpening: sharpenIntroSuggestion(slug, intro, bucket, ctr),
      ctaAlignment: `Keep primary CTA to ${primaryTool} above the fold; mention one outcome (e.g. 'generate 50 variants') if absent.`,
      relatedLinkSuggestions: relatedLinks
    },
    safeApply,
    inspectability: {
      why: "Heuristics from bucket, CTR, impressions, position, and MDX length; safeApply.description is length-clamped only"
    }
  };
}

function main() {
  const candDoc = safeReadJson(CANDIDATES_PATH);
  if (!candDoc || !Array.isArray(candDoc.candidates)) {
    const stub = {
      updatedAt: new Date().toISOString(),
      error: "Run build-page-optimization-candidates.js first",
      items: []
    };
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(stub, null, 2), "utf8");
    console.warn("[build-page-optimization-recommendations] No candidates file.");
    return;
  }

  const items = [];
  for (const c of candDoc.candidates) {
    const mdxPath = path.join(BLOG_DIR, `${c.slug}.mdx`);
    items.push(buildRecommendations(c, mdxPath));
  }

  const byBucket = {};
  for (const it of items) {
    const b = it.bucket || "?";
    byBucket[b] = (byBucket[b] || 0) + 1;
  }

  const out = {
    updatedAt: new Date().toISOString(),
    source: "page-optimization-candidates.json + content/blog/*.mdx",
    summary: {
      total: items.length,
      byBucket,
      missingMdx: items.filter((i) => i.status === "missing_file").length,
      note: "Feeds optimize-en-pages.js; append-only history on --write"
    },
    items
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2), "utf8");
  console.log(`[build-page-optimization-recommendations] ${items.length} items → ${OUT}`);
}

main();
