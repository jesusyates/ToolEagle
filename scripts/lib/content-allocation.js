/**
 * V111 — Growth-driven EN programmatic blog allocation (batch, no DB).
 * Reads generated/growth-priority.json + writes generated/content-allocation-plan.json
 */

const fs = require("fs");
const path = require("path");

const PLATFORMS = ["tiktok", "youtube", "instagram"];
const CONTENT_TYPES = ["captions", "hashtags", "titles", "hooks"];

/** Map tool slugs → which platform/intent to reinforce (partial = any platform). */
const TOOL_SIGNAL = {
  "tiktok-caption-generator": { platforms: ["tiktok"], intents: ["captions"] },
  "instagram-caption-generator": { platforms: ["instagram"], intents: ["captions"] },
  "hashtag-generator": { platforms: null, intents: ["hashtags"] },
  "title-generator": { platforms: null, intents: ["titles"] },
  "youtube-title-generator": { platforms: ["youtube"], intents: ["titles"] },
  "hook-generator": { platforms: null, intents: ["hooks"] }
};

const GROWTH_PATH = path.join(process.cwd(), "generated", "growth-priority.json");
const PLAN_PATH = path.join(process.cwd(), "generated", "content-allocation-plan.json");

function parseProgrammaticSlug(slug) {
  const parts = String(slug || "").split("-");
  if (parts.length < 3) return null;
  const platforms = new Set(PLATFORMS);
  const contentTypes = new Set(CONTENT_TYPES);
  const platform = parts[0];
  const contentType = parts[1];
  if (!platforms.has(platform) || !contentTypes.has(contentType)) return null;
  return { platform, contentType, topic: parts.slice(2).join("-") };
}

function safeReadJson(p) {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function slugFromRow(row) {
  if (!row) return null;
  return typeof row === "string" ? row : row.slug;
}

/**
 * Build allocation plan object from V110 growth-priority.json
 */
function buildAllocationPlanFromGrowth(growth) {
  const rationale = [];
  const priorityPlatforms = {};
  const priorityTopics = {};
  const priorityIntents = {};
  const reducedClusters = [];
  const pausedClusters = [];

  const bump = (obj, key, delta) => {
    if (!key) return;
    obj[key] = (obj[key] || 1) + delta;
  };

  const topBlogs = growth?.topBlogs || [];
  const underBlogs = growth?.underperformingBlogs || [];
  const topTools = growth?.topTools || [];
  const underTools = growth?.underperformingTools || [];
  const expandFrom = growth?.decisions?.expandTopicsFrom || [];
  const reduceFocus = growth?.decisions?.reduceFocusSlugs || [];
  const improveTools = growth?.decisions?.improveToolsFirst || [];

  for (const row of topBlogs) {
    const slug = slugFromRow(row);
    const p = parseProgrammaticSlug(slug);
    if (!p) continue;
    bump(priorityPlatforms, p.platform, 0.08);
    bump(priorityTopics, p.topic, 0.06);
    bump(priorityIntents, p.contentType, 0.05);
  }

  for (const s of expandFrom) {
    const p = parseProgrammaticSlug(s);
    if (p) {
      bump(priorityPlatforms, p.platform, 0.06);
      bump(priorityTopics, p.topic, 0.05);
      bump(priorityIntents, p.contentType, 0.04);
    }
  }

  for (const row of topTools) {
    const toolSlug = slugFromRow(row);
    const sig = TOOL_SIGNAL[toolSlug];
    if (!sig) {
      rationale.push({ cluster: toolSlug, action: "note", reason: "topTool: no TOOL_SIGNAL mapping" });
      continue;
    }
    const plats = sig.platforms || PLATFORMS;
    for (const pl of plats) {
      bump(priorityPlatforms, pl, 0.05);
    }
    for (const intent of sig.intents || []) {
      bump(priorityIntents, intent, 0.07);
    }
  }

  for (const row of underBlogs) {
    const slug = slugFromRow(row);
    const p = parseProgrammaticSlug(slug);
    if (p) {
      reducedClusters.push({
        kind: "blog_pattern",
        platform: p.platform,
        contentType: p.contentType,
        topic: p.topic,
        multiplier: 0.55,
        reason: `underperformingBlog: ${slug}`
      });
    }
  }

  for (const s of reduceFocus) {
    const p = parseProgrammaticSlug(s);
    if (p) {
      reducedClusters.push({
        kind: "blog_pattern",
        platform: p.platform,
        contentType: p.contentType,
        topic: p.topic,
        multiplier: 0.45,
        reason: `decisions.reduceFocusSlugs: ${s}`
      });
    }
  }

  for (const row of underTools) {
    const toolSlug = slugFromRow(row);
    const sig = TOOL_SIGNAL[toolSlug];
    if (!sig) continue;
    const plats = sig.platforms || PLATFORMS;
    for (const pl of plats) {
      reducedClusters.push({
        kind: "platform_intent",
        platform: pl,
        intent: sig.intents?.[0] || "captions",
        multiplier: 0.6,
        reason: `underperformingTool ${toolSlug} — reduce over-feed unless strategic`
      });
    }
  }

  const bottomBlogSlugs = underBlogs
    .map(slugFromRow)
    .filter(Boolean)
    .slice(0, 8);
  for (const slug of bottomBlogSlugs) {
    pausedClusters.push({
      exactSlug: slug,
      reason: "lowest underperformingBlogs — temporary pause new identical cluster"
    });
  }

  for (const t of improveTools) {
    rationale.push({
      cluster: t,
      action: "improve_tool_first",
      reason: "V110 improveToolsFirst — improve tool before scaling matching topics"
    });
  }

  rationale.push({
    action: "summary",
    reason: "priority* = multiplicative weights from topBlogs/expandTopicsFrom/topTools; reducedClusters lower matching triples; pausedClusters skip exact slugs",
    topPlatforms: Object.entries(priorityPlatforms)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6),
    topTopics: Object.entries(priorityTopics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12),
    topIntents: Object.entries(priorityIntents)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
  });

  return {
    updatedAt: new Date().toISOString(),
    source: "growth-priority.json (V110)",
    priorityPlatforms,
    priorityTopics,
    priorityIntents,
    reducedClusters,
    pausedClusters,
    rationale: rationale.slice(0, 200),
    weightsNote:
      "Multipliers stack on base 1.0; final weight = platform*topic*intent*reduction. Paused exact slugs skip generation."
  };
}

function writeAllocationPlan(plan) {
  fs.mkdirSync(path.dirname(PLAN_PATH), { recursive: true });
  fs.writeFileSync(PLAN_PATH, JSON.stringify(plan, null, 2), "utf8");
  return PLAN_PATH;
}

function loadContentAllocationPlan() {
  const raw = safeReadJson(PLAN_PATH);
  if (raw && raw.priorityPlatforms) return raw;
  return {
    updatedAt: null,
    priorityPlatforms: {},
    priorityTopics: {},
    priorityIntents: {},
    reducedClusters: [],
    pausedClusters: [],
    rationale: [],
    weightsNote: "No content-allocation-plan.json — run: node scripts/build-content-allocation-plan.js"
  };
}

function clusterKey(platform, contentType, topic) {
  return `${platform}-${contentType}-${topic}`;
}

function isPaused(slug, plan) {
  const paused = plan.pausedClusters || [];
  return paused.some((p) => p.exactSlug === slug);
}

function computeTripleWeight(platform, contentType, topic, plan) {
  const pp = plan.priorityPlatforms || {};
  const pt = plan.priorityTopics || {};
  const pi = plan.priorityIntents || {};
  let w =
    (pp[platform] ?? 1) *
    (pt[topic] ?? 1) *
    (pi[contentType] ?? 1);

  const slug = clusterKey(platform, contentType, topic);
  for (const rc of plan.reducedClusters || []) {
    if (rc.kind === "blog_pattern" && rc.platform === platform && rc.contentType === contentType && rc.topic === topic) {
      w *= rc.multiplier ?? 0.5;
    }
    if (
      rc.kind === "platform_intent" &&
      rc.platform === platform &&
      (rc.intent === contentType || rc.contentType === contentType)
    ) {
      w *= rc.multiplier ?? 0.6;
    }
  }
  return Math.max(0.05, w);
}

/**
 * Diversify: within each platform, triples sorted by weight desc; then round-robin across platforms.
 */
function diversifyByPlatform(triplesWithWeight, platforms) {
  const buckets = new Map(platforms.map((p) => [p, []]));
  for (const t of triplesWithWeight) {
    buckets.get(t.platform).push(t);
  }
  for (const p of platforms) {
    buckets.get(p).sort((a, b) => b.weight - a.weight);
  }
  const out = [];
  let idx = 0;
  let progressed = true;
  while (progressed) {
    progressed = false;
    for (const p of platforms) {
      const b = buckets.get(p);
      if (idx < b.length) {
        out.push(b[idx]);
        progressed = true;
      }
    }
    idx++;
  }
  return out;
}

/**
 * All (platform, contentType, topic) combos with weights; paused removed; diversified order.
 */
function buildGenerationOrder(platforms, contentTypes, topics, plan) {
  const list = [];
  for (const platform of platforms) {
    for (const contentType of contentTypes) {
      for (const topic of topics) {
        const slug = clusterKey(platform, contentType, topic);
        if (isPaused(slug, plan)) continue;
        const weight = computeTripleWeight(platform, contentType, topic, plan);
        list.push({ platform, contentType, topic, slug, weight });
      }
    }
  }
  const noise = () => 0.92 + Math.random() * 0.16;
  const scored = list.map((t) => ({ ...t, sortKey: t.weight * noise() }));
  scored.sort((a, b) => b.sortKey - a.sortKey);
  return diversifyByPlatform(scored, platforms);
}

module.exports = {
  PLATFORMS,
  CONTENT_TYPES,
  TOOL_SIGNAL,
  GROWTH_PATH,
  PLAN_PATH,
  parseProgrammaticSlug,
  buildAllocationPlanFromGrowth,
  writeAllocationPlan,
  loadContentAllocationPlan,
  computeTripleWeight,
  buildGenerationOrder,
  clusterKey,
  isPaused
};
