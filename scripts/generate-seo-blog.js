/**
 * SEO Blog Generator - Target 500 posts
 * Topics: TikTok captions ideas, TikTok hook ideas, YouTube shorts titles, Instagram caption ideas
 *
 * Usage: node scripts/generate-seo-blog.js [--dry-run] [--limit N]
 */

const fs = require("fs");
const path = require("path");

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

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

function generateContent(platform, contentType, topic) {
  const topicLabel = formatLabel(topic);
  const platformLabel = getPlatformLabel(platform);
  const typeLabel = getTypeLabel(contentType);
  const toolSlug = getToolSlug(platform, contentType);

  const sections = [
    { id: `${topic}-1`, title: `${topicLabel} ${typeLabel}` },
    { id: `${topic}-2`, title: `More ${topicLabel} ideas` },
    { id: `${topic}-3`, title: `Best for ${platformLabel}` }
  ];

  const body = `Use these ${topicLabel.toLowerCase()} ${platformLabel} ${typeLabel.toLowerCase()} as inspiration. Generate more with the [${platformLabel} ${typeLabel} Generator](/tools/${toolSlug}).

## ${topicLabel} ${typeLabel}

1. Example 1
2. Example 2
3. Example 3
4. Example 4
5. Example 5

## More ${topicLabel} ideas

1. Example 1
2. Example 2
3. Example 3

## Best for ${platformLabel}

1. Example 1
2. Example 2
3. Example 3

## Summary

Generate more ${topicLabel.toLowerCase()} ${typeLabel.toLowerCase()} with the [${platformLabel} ${typeLabel} Generator](/tools/${toolSlug}).`;

  return {
    title: `50 ${topicLabel} ${platformLabel} ${typeLabel.replace(/s$/, "")} Ideas (2026)`,
    description: `200+ ${topicLabel} ${platformLabel} ${typeLabel.toLowerCase()} for your videos. Copy and use instantly or generate more with AI.`,
    slug: generateSlug(platform, contentType, topic),
    tags: [platform, contentType, topic],
    toc: sections,
    recommendedTools: [toolSlug],
    body
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

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : 50;
  const dateISO = new Date().toISOString().slice(0, 10);

  if (!fs.existsSync(BLOG_DIR)) {
    fs.mkdirSync(BLOG_DIR, { recursive: true });
  }

  const existing = new Set(fs.readdirSync(BLOG_DIR).filter(f => f.endsWith(".mdx")).map(f => f.replace(".mdx", "")));
  let generated = 0;
  let skipped = 0;

  for (const platform of PLATFORMS) {
    for (const contentType of CONTENT_TYPES) {
      for (const topic of TOPICS) {
        if (limit && generated >= limit) break;

        const slug = generateSlug(platform, contentType, topic);
        if (existing.has(slug)) {
          skipped++;
          continue;
        }

        const data = generateContent(platform, contentType, topic);
        const mdx = buildMdx(data);
        const filePath = path.join(BLOG_DIR, `${slug}.mdx`);

        if (!dryRun) {
          fs.writeFileSync(filePath, mdx, "utf8");
        }
        generated++;
        if (dryRun) console.log(`[dry-run] Would create: ${slug}.mdx`);
      }
      if (limit && generated >= limit) break;
    }
    if (limit && generated >= limit) break;
  }

  console.log(`SEO Blog Generator: ${generated} created, ${skipped} skipped (already exist)`);
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

main();
