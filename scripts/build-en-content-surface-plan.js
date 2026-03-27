#!/usr/bin/env node
/**
 * V123 — EN content surface expansion planner.
 * Creates a lightweight, explainable plan for blog + answers + guides.
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const OUT = path.join(ROOT, "generated", "en-content-surface-plan.json");
const ALLOCATION_PATH = path.join(ROOT, "generated", "content-allocation-plan.json");
const GROWTH_PATH = path.join(ROOT, "generated", "growth-priority.json");

function readJson(filePath, fallback = {}) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function scoreBoost(mapObj, key) {
  if (!mapObj || typeof mapObj !== "object") return 1;
  const raw = Number(mapObj[key]);
  return Number.isFinite(raw) && raw > 0 ? raw : 1;
}

function main() {
  const allocation = readJson(ALLOCATION_PATH, {});
  const growth = readJson(GROWTH_PATH, {});

  const priorityPlatforms = allocation.priorityPlatforms || {};
  const priorityTopics = allocation.priorityTopics || {};
  const priorityIntents = allocation.priorityIntents || {};
  const growthTopTools = Array.isArray(growth.topTools) ? growth.topTools : [];
  const topToolSlugs = new Set(growthTopTools.map((t) => t?.slug).filter(Boolean));

  const clusters = [
    {
      platform: "tiktok",
      topic: "captions",
      intent: "idea/listicle",
      primaryTool: "tiktok-caption-generator",
      answerUrl: "/answers/how-to-write-tiktok-captions",
      guideUrl: "/how-to/write-viral-captions"
    },
    {
      platform: "tiktok",
      topic: "hooks",
      intent: "question/explicit",
      primaryTool: "hook-generator",
      answerUrl: "/answers/how-to-write-viral-hooks",
      guideUrl: "/how-to/create-viral-hooks"
    },
    {
      platform: "tiktok",
      topic: "growth",
      intent: "how-to/workflow",
      primaryTool: "tiktok-caption-generator",
      answerUrl: "/answers/how-to-go-viral-tiktok",
      guideUrl: "/how-to/grow-on-tiktok"
    },
    {
      platform: "youtube",
      topic: "titles",
      intent: "idea/listicle",
      primaryTool: "youtube-title-generator",
      answerUrl: "/answers/youtube-title-formulas",
      guideUrl: "/how-to/get-youtube-subscribers"
    },
    {
      platform: "youtube",
      topic: "hooks",
      intent: "question/explicit",
      primaryTool: "hook-generator",
      answerUrl: "/answers/how-to-write-youtube-hooks",
      guideUrl: "/how-to/create-viral-hooks"
    },
    {
      platform: "youtube",
      topic: "growth",
      intent: "how-to/workflow",
      primaryTool: "youtube-title-generator",
      answerUrl: "/answers/how-to-go-viral-youtube",
      guideUrl: "/en/how-to/youtube-growth"
    },
    {
      platform: "instagram",
      topic: "captions",
      intent: "idea/listicle",
      primaryTool: "instagram-caption-generator",
      answerUrl: "/answers/how-to-write-instagram-captions",
      guideUrl: "/how-to/go-viral-on-instagram"
    },
    {
      platform: "instagram",
      topic: "hashtags",
      intent: "question/explicit",
      primaryTool: "hashtag-generator",
      answerUrl: "/answers/how-many-hashtags-instagram",
      guideUrl: "/en/how-to/instagram-growth"
    },
    {
      platform: "instagram",
      topic: "growth",
      intent: "how-to/workflow",
      primaryTool: "instagram-caption-generator",
      answerUrl: "/answers/how-to-go-viral-instagram",
      guideUrl: "/how-to/get-instagram-followers"
    }
  ];

  const planned = clusters
    .map((c) => {
      const p = scoreBoost(priorityPlatforms, c.platform);
      const t = scoreBoost(priorityTopics, c.topic);
      const i = scoreBoost(priorityIntents, c.intent);
      const toolBoost = topToolSlugs.has(c.primaryTool) ? 1.2 : 1.0;
      const score = Number((p * t * i * toolBoost).toFixed(4));

      const pageTypesToProduce = ["blog"];
      if (c.answerUrl) pageTypesToProduce.push("answer");
      if (c.guideUrl) pageTypesToProduce.push("guide");
      const workflowIntent = /how-to|workflow/i.test(c.intent);
      const primaryType = workflowIntent ? "guide" : "blog";
      const blogPrimaryUrl = `/blog/${c.platform}-${c.topic}-ideas`;
      const primaryUrl = primaryType === "guide" ? c.guideUrl || blogPrimaryUrl : blogPrimaryUrl;
      const supportingPages = [
        { type: "blog", url: blogPrimaryUrl, role: primaryType === "blog" ? "primary" : "support" },
        ...(c.answerUrl ? [{ type: "answer", url: c.answerUrl, role: "support" }] : []),
        ...(c.guideUrl ? [{ type: "guide", url: c.guideUrl, role: primaryType === "guide" ? "primary" : "support" }] : [])
      ].filter((p) => p.url !== primaryUrl || p.type !== primaryType);

      const rationale = [
        `reinforces strong tool ${c.primaryTool}`,
        `signal score platform=${p.toFixed(2)} topic=${t.toFixed(2)} intent=${i.toFixed(2)}`,
        toolBoost > 1 ? "tool conversion signal boost applied" : "baseline tool boost applied",
        `ownership assigned: ${primaryType} is primary for this topic`,
        "intent split preserved: blog broad, answer explicit question, guide workflow"
      ];

      return {
        platform: c.platform,
        topic: c.topic,
        intent: c.intent,
        primaryType,
        primaryUrl,
        pageTypesToProduce,
        supportingRoles: {
          blog: primaryType === "blog" ? "primary" : "support",
          answer: "support",
          guide: primaryType === "guide" ? "primary" : "support"
        },
        supportingPages,
        pageTargets: {
          answerUrl: c.answerUrl || null,
          guideUrl: c.guideUrl || null
        },
        primaryTool: c.primaryTool,
        score,
        rationale
      };
    })
    .sort((a, b) => b.score - a.score);

  const doc = {
    updatedAt: new Date().toISOString(),
    sourceSignals: {
      contentAllocationPlan: fs.existsSync(ALLOCATION_PATH),
      growthPriority: fs.existsSync(GROWTH_PATH)
    },
    decisionRules: {
      blogPrimary: true,
      answerSecondaryCapDefault: 5,
      guideSecondaryCapDefault: 2,
      intentSeparation: {
        blog: "broader examples/listicle",
        answer: "short explicit question intent",
        guide: "how-to workflow intent"
      }
    },
    topics: planned
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(doc, null, 2), "utf8");
  console.log(`[V123] content surface plan -> ${OUT} topics=${planned.length}`);
}

main();

