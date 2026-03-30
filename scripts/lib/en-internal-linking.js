/**
 * Governed by docs/system-blueprint.md.
 * Do not implement logic that conflicts with blueprint rules.
 *
 * EN blog internal link scoring — single convergence order (V181.1 + V182):
 *   1) base relevance — Jaccard similarity on fingerprint hashes (related blog picks)
 *   2) search + growth sets — priority / weak from search-priority-recommendations, tool-conversion-map, growth-priority
 *   3) V176 — boost_slugs / reduce_slugs on blog slugs (+link_score_boost_bonus / reduce_penalty)
 *   4) V181 — exact-revenue tool boost & friction penalty on primary tool inferred from each blog slug + preferredOutboundTargets for ops
 *   5) V182 — entry boost on high exact-revenue blog slugs + related-tools placement order (peak/stable)
 *   6) hard exclude — content-quality internalLinkExcludePaths (answers/tools/guides only where used)
 *
 * `build-internal-link-priority-report.ts` output is for tool→tool UI ranking; EN blog MDX write path uses **this module** + v176 + v181 + v182 JSON.
 */
const fs = require("fs");
const path = require("path");

/** V107 + V108 + V110 unified growth — merged into link priority / weak sets. */
function loadSearchLinkPriority() {
  const p = path.join(process.cwd(), "generated", "search-priority-recommendations.json");
  const c = path.join(process.cwd(), "generated", "tool-conversion-map.json");
  const g = path.join(process.cwd(), "generated", "growth-priority.json");
  const priority = new Set();
  const weak = new Set();
  try {
    if (fs.existsSync(p)) {
      const j = JSON.parse(fs.readFileSync(p, "utf8"));
      (j.linkPrioritySlugs || []).forEach((s) => priority.add(String(s)));
      (j.weakLinkSlugs || []).forEach((s) => weak.add(String(s)));
    }
  } catch {
    /* ignore */
  }
  try {
    if (fs.existsSync(c)) {
      const j = JSON.parse(fs.readFileSync(c, "utf8"));
      (j.classification?.high_conversion_pages || []).forEach((s) => priority.add(String(s)));
      (j.classification?.low_conversion_pages || []).forEach((s) => weak.add(String(s)));
    }
  } catch {
    /* ignore */
  }
  try {
    if (fs.existsSync(g)) {
      const j = JSON.parse(fs.readFileSync(g, "utf8"));
      const addSlug = (row) => {
        const s = typeof row === "string" ? row : row?.slug;
        if (s) priority.add(String(s));
      };
      const weakSlug = (row) => {
        const s = typeof row === "string" ? row : row?.slug;
        if (s) weak.add(String(s));
      };
      (j.topBlogs || []).forEach(addSlug);
      (j.decisions?.linkBoostSlugs || []).forEach((s) => s && priority.add(String(s)));
      (j.underperformingBlogs || []).forEach(weakSlug);
      (j.decisions?.reduceFocusSlugs || []).forEach((s) => s && weak.add(String(s)));
    }
  } catch {
    /* ignore */
  }
  for (const x of priority) weak.delete(x);
  return {
    prioritySet: priority,
    weakSet: weak,
    v176: loadV176LinkWeights(),
    v181: loadV181LinkWeights(),
    v182: loadV182EntryBoost()
  };
}

/** V176 — bias related-page picks toward execution-layer winners. */
function loadV176LinkWeights() {
  const p = path.join(process.cwd(), "generated", "v176-internal-link-weights.json");
  if (!fs.existsSync(p)) return null;
  try {
    const j = JSON.parse(fs.readFileSync(p, "utf8"));
    const boost = j.boost_slugs || [];
    const reduce = j.reduce_slugs || [];
    return {
      boost: new Set(boost.map(String)),
      reduce: new Set(reduce.map(String)),
      boostBonus: Number.isFinite(Number(j.link_score_boost_bonus)) ? Number(j.link_score_boost_bonus) : 0.22,
      reducePenalty: Number.isFinite(Number(j.link_score_reduce_penalty)) ? Number(j.link_score_reduce_penalty) : 0.12
    };
  } catch {
    return null;
  }
}

/**
 * V181 — revenue link weights (tool slug keys). Used for blog scoring via blogSlugToPrimaryToolSlug.
 * Source: generated/v181-revenue-link-priority.json (run-v181-revenue-growth-control.js).
 */
function loadV181LinkWeights() {
  const p = path.join(process.cwd(), "generated", "v181-revenue-link-priority.json");
  if (!fs.existsSync(p)) return null;
  try {
    const j = JSON.parse(fs.readFileSync(p, "utf8"));
    const boost = j.linkScoreBoostByToolSlug && typeof j.linkScoreBoostByToolSlug === "object" ? j.linkScoreBoostByToolSlug : {};
    const penalty = j.linkScorePenaltyByToolSlug && typeof j.linkScorePenaltyByToolSlug === "object" ? j.linkScorePenaltyByToolSlug : {};
    const preferredOutboundTargets =
      j.preferredOutboundTargets && typeof j.preferredOutboundTargets === "object" ? j.preferredOutboundTargets : {};
    return { boostByTool: boost, penaltyByTool: penalty, preferredOutboundTargets };
  } catch {
    return null;
  }
}

/**
 * V182 — revenue entry boost (exact paths only). Source: generated/v182-revenue-entry-boost.json.
 */
function loadV182EntryBoost() {
  const p = path.join(process.cwd(), "generated", "v182-revenue-entry-boost.json");
  if (!fs.existsSync(p)) return null;
  try {
    const j = JSON.parse(fs.readFileSync(p, "utf8"));
    const blogSlugBoost =
      j.blog_slug_entry_boost && typeof j.blog_slug_entry_boost === "object" ? j.blog_slug_entry_boost : {};
    const toolBoost =
      j.tool_entry_boost && typeof j.tool_entry_boost === "object" ? j.tool_entry_boost : {};
    const placementBoostOrder = Array.isArray(j.related_tools_placement_boost)
      ? j.related_tools_placement_boost.map(String)
      : [];
    return { blogSlugBoost, toolBoost, placementBoostOrder };
  } catch {
    return null;
  }
}

/** Map programmatic blog slug → primary monetization tool for that page (same as Related tools default). */
function blogSlugToPrimaryToolSlug(blogSlug) {
  const meta = parseEnBlogSlugMeta(blogSlug);
  if (!meta) return null;
  return getEnToolSlugForMeta({ platform: meta.platform, contentType: meta.contentType });
}

function toolHrefToSlug(href) {
  const m = String(href || "").match(/\/tools\/([a-z0-9-]+)/);
  return m ? m[1] : null;
}

/**
 * Re-order related tool links: V181 revenue boost + V182 peak/stable placement (exact revenue only).
 */
function sortToolLinksByV181Revenue(links, v181, v182) {
  if (!Array.isArray(links) || links.length === 0) return links || [];
  const nb = Object.keys(v181?.boostByTool || {}).length;
  const np = Object.keys(v181?.penaltyByTool || {}).length;
  const has182 = v182 && (Object.keys(v182.toolBoost || {}).length > 0 || (v182.placementBoostOrder || []).length > 0);
  if ((!v181 || (nb === 0 && np === 0)) && !has182) return links;
  const placementIdx = (tool) => {
    const arr = v182?.placementBoostOrder || [];
    const i = arr.indexOf(tool);
    return i >= 0 ? 30 - i * 0.15 : 0;
  };
  const rank = (href) => {
    const tool = toolHrefToSlug(href);
    if (!tool) return 0;
    let s = 0;
    if (v181) {
      const b = Number(v181.boostByTool[tool]);
      const p = Number(v181.penaltyByTool[tool]);
      if (Number.isFinite(b) && b > 1) s += (b - 1) * 10;
      if (Number.isFinite(p) && p < 1) s += (p - 1) * 8;
    }
    if (v182?.toolBoost?.[tool]) {
      const tier = v182.toolBoost[tool].tier;
      if (tier === "peak") s += 14;
      else if (tier === "stable") s += 5;
    }
    s += placementIdx(tool);
    return s;
  };
  return [...links].sort((a, b) => rank(b.href) - rank(a.href));
}

/** V171.2 — hard-excluded answer (and other) paths from content-quality-status.json */
function loadInternalLinkHardExcludes() {
  const set = new Set();
  try {
    const cq = path.join(process.cwd(), "generated", "content-quality-status.json");
    if (!fs.existsSync(cq)) return set;
    const doc = JSON.parse(fs.readFileSync(cq, "utf8"));
    const paths = doc.internalLinkExcludePaths || doc.noindexPaths || [];
    for (const p of paths) {
      if (p) set.add(String(p));
    }
  } catch {
    /* optional */
  }
  return set;
}

function filterHardExcludedHrefs(links, excludeSet) {
  if (!excludeSet || excludeSet.size === 0) return links || [];
  return (links || []).filter((l) => l && l.href && !excludeSet.has(l.href));
}

function linkScoreAdjust(slug, prioritySet, weakSet, v176, v181, v182) {
  let adj = 0;
  if (prioritySet && prioritySet.has(slug)) adj += 0.12;
  if (weakSet && weakSet.has(slug)) adj -= 0.08;
  if (v176?.boost?.has(slug)) adj += v176.boostBonus;
  if (v176?.reduce?.has(slug)) adj -= v176.reducePenalty;
  if (v181) {
    const tool = blogSlugToPrimaryToolSlug(slug);
    if (tool) {
      const b = Number(v181.boostByTool[tool]);
      const p = Number(v181.penaltyByTool[tool]);
      if (Number.isFinite(b) && b > 1) adj += Math.min(0.42, (b - 1) * 0.32);
      if (Number.isFinite(p) && p < 1) adj -= Math.min(0.38, (1 - p) * 0.42);
    }
  }
  if (v182?.blogSlugBoost) {
    const m = Number(v182.blogSlugBoost[slug]);
    if (Number.isFinite(m) && m > 1) adj += Math.min(0.28, (m - 1) * 0.35);
  }
  return adj;
}

/** Prefer search-strong pages when choosing who receives backlinks to the new post. */
function sortBlogSlugsForBacklinks(slugs, prioritySet, weakSet, v176, v181, v182) {
  const pri = prioritySet || new Set();
  const weak = weakSet || new Set();
  return [...(slugs || [])].sort((a, b) => {
    const rank = (s) => {
      let r = pri.has(s) ? 2 : weak.has(s) ? 0 : 1;
      if (v176?.boost?.has(s)) r += 1.5;
      if (v176?.reduce?.has(s)) r -= 1;
      if (v181) {
        const tool = blogSlugToPrimaryToolSlug(s);
        if (tool) {
          const b = Number(v181.boostByTool[tool]);
          const p = Number(v181.penaltyByTool[tool]);
          if (Number.isFinite(b) && b > 1) r += Math.min(1.4, (b - 1) * 2.2);
          if (Number.isFinite(p) && p < 1) r -= Math.min(1.2, (1 - p) * 2.5);
        }
      }
      if (v182?.blogSlugBoost) {
        const m = Number(v182.blogSlugBoost[s]);
        if (Number.isFinite(m) && m > 1) r += Math.min(1.1, (m - 1) * 0.9);
      }
      return r;
    };
    return rank(b) - rank(a);
  });
}

function intentGroupForContentType(contentType) {
  // V104: keep intent alignment with the generator's contentType labels.
  // - captions/hooks: same workflow (wording + talking points)
  // - titles: idea-like but should still connect to captions/hooks ("ideas")
  // - hashtags: tag strategy
  if (contentType === "captions" || contentType === "hooks") return "caption_hooks";
  if (contentType === "titles") return "caption_hooks";
  if (contentType === "hashtags") return "hashtags";
  return "other";
}

function parseEnBlogSlugMeta(slug) {
  // generateSlug(platform, contentType, topic) => `${platform}-${contentType}-${topic}`
  const parts = String(slug || "").split("-");
  if (parts.length < 3) return null;
  const platform = parts[0];
  const contentType = parts[1];
  const topic = parts.slice(2).join("-");
  return { platform, contentType, topic };
}

function jaccardScore(setA, setB) {
  if (!setA || !setB || !(setA instanceof Set) || !(setB instanceof Set)) return 0;
  const [small, big] = setA.size < setB.size ? [setA, setB] : [setB, setA];
  let inter = 0;
  for (const x of small) if (big.has(x)) inter++;
  const union = setA.size + setB.size - inter;
  return union === 0 ? 0 : inter / union;
}

function buildEnBlogLinkIndex(corpusFingerprints) {
  const fpBySlug = new Map();
  const byPlatformTopic = new Map(); // `${platform}|${topic}` => slugs[]
  const byPlatformTopicGroup = new Map(); // `${platform}|${topic}|${group}` => slugs[]
  const byPlatformGroup = new Map(); // `${platform}|${group}` => slugs[]
  const byPlatform = new Map(); // `${platform}` => slugs[]

  const index = {
    fpBySlug,
    byPlatformTopic,
    byPlatformTopicGroup,
    byPlatformGroup,
    byPlatform
  };

  for (const fp of corpusFingerprints || []) {
    if (!fp?.slug || !fp?.hashes) continue;
    addEnBlogFpToLinkIndex(index, fp);
  }

  return index;
}

function addEnBlogFpToLinkIndex(index, fp) {
  const meta = parseEnBlogSlugMeta(fp.slug);
  if (!meta) return;
  const group = intentGroupForContentType(meta.contentType);
  index.fpBySlug.set(fp.slug, fp);

  const kPlatformTopic = `${meta.platform}|${meta.topic}`;
  const kPlatformTopicGroup = `${meta.platform}|${meta.topic}|${group}`;
  const kPlatformGroup = `${meta.platform}|${group}`;

  if (!index.byPlatformTopic.has(kPlatformTopic)) index.byPlatformTopic.set(kPlatformTopic, []);
  if (!index.byPlatformTopicGroup.has(kPlatformTopicGroup)) index.byPlatformTopicGroup.set(kPlatformTopicGroup, []);
  if (!index.byPlatformGroup.has(kPlatformGroup)) index.byPlatformGroup.set(kPlatformGroup, []);
  if (!index.byPlatform.has(meta.platform)) index.byPlatform.set(meta.platform, []);

  // Keep de-dupe in case a re-add happens.
  const addOnce = (map, key) => {
    const arr = map.get(key);
    if (!arr.includes(fp.slug)) arr.push(fp.slug);
  };
  addOnce(index.byPlatformTopic, kPlatformTopic);
  addOnce(index.byPlatformTopicGroup, kPlatformTopicGroup);
  addOnce(index.byPlatformGroup, kPlatformGroup);
  addOnce(index.byPlatform, meta.platform);
}

function selectEnBlogRelatedPageSlugs({
  index,
  platform,
  contentType,
  topic,
  newSlug,
  newHashes,
  desiredMin = 3,
  desiredMax = 10,
  desiredCount = 6,
  linkPriority
}) {
  const prioritySet =
    linkPriority?.prioritySet instanceof Set
      ? linkPriority.prioritySet
      : new Set(Array.isArray(linkPriority?.prioritySlugs) ? linkPriority.prioritySlugs : []);
  const weakSet =
    linkPriority?.weakSet instanceof Set
      ? linkPriority.weakSet
      : new Set(Array.isArray(linkPriority?.weakSlugs) ? linkPriority.weakSlugs : []);

  const v176 = linkPriority?.v176 || null;
  const v181 = linkPriority?.v181 || null;
  const v182 = linkPriority?.v182 || null;

  const group = intentGroupForContentType(contentType);
  const k1 = `${platform}|${topic}|${group}`;
  const k2 = `${platform}|${topic}`;
  const k3 = `${platform}|${group}`;
  const k4 = `${platform}`;

  const tiers = [
    index.byPlatformTopicGroup.get(k1) || [],
    index.byPlatformTopic.get(k2) || [],
    index.byPlatformGroup.get(k3) || [],
    index.byPlatform.get(k4) || []
  ];

  const picked = [];
  const seen = new Set();

  const maxPick = Math.max(desiredMin, Math.min(desiredCount, desiredMax));

  for (const tier of tiers) {
    const candidates = tier
      .filter((s) => s && s !== newSlug && index.fpBySlug.has(s) && index.fpBySlug.get(s)?.hashes)
      .slice(0, 60); // hard cap to control runtime in large buckets

    const scored = candidates
      .map((slug) => {
        const fp = index.fpBySlug.get(slug);
        if (!fp?.hashes) return null;
        const base = jaccardScore(newHashes, fp.hashes);
        return { slug, score: base + linkScoreAdjust(slug, prioritySet, weakSet, v176, v181, v182) };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);

    for (const { slug } of scored) {
      if (seen.has(slug)) continue;
      seen.add(slug);
      picked.push(slug);
      if (picked.length >= maxPick) break;
    }

    if (picked.length >= desiredMin) break;
  }

  // Ensure 3–10 when possible; if not enough candidates, return what we have.
  return picked.slice(0, desiredMax);
}

function extractEnBlogTitleFromMdx(mdx) {
  const text = String(mdx || "");
  // generated buildMdx uses: title: "..."
  const m = text.match(/^---\s*[\s\S]*?\n---\s*\n[\s\S]*$/m);
  void m;
  const titleMatch = text.match(/\ntitle:\s*"([^"]*)"\s*\n/);
  return titleMatch ? titleMatch[1] : "";
}

function injectEnBlogRelatedPagesSectionIntoBody(body, relatedLinks, { minLinks = 3, maxLinks = 10 } = {}) {
  const heading = "## Related pages";
  const summaryMarker = "\n## Summary";

  const links = Array.isArray(relatedLinks) ? relatedLinks : [];
  const trimmed = links.slice(0, maxLinks);
  const bullets = trimmed.map((l) => `- [${l.title || l.slug}](/blog/${l.slug})`);

  let section = `${heading}\n\n${bullets.join("\n")}\n`;

  if (trimmed.length < minLinks && trimmed.length > 0) {
    // still inject; quality gate doesn't require related pages.
    section = `${heading}\n\n${bullets.join("\n")}\n`;
  }

  const idx = String(body).indexOf(summaryMarker);
  if (idx >= 0) {
    // Insert before Summary.
    const before = body.slice(0, idx).trimEnd();
    const after = body.slice(idx);
    return `${before}\n\n${section}\n${after}`.replace(/\n{3,}/g, "\n\n");
  }

  // Fallback: append at end.
  return `${String(body).trimEnd()}\n\n${section}`;
}

function upsertEnBlogRelatedPagesSectionIntoBody(body, relatedLinks, { minLinks = 3, maxLinks = 10 } = {}) {
  const b = String(body || "");
  const heading = "## Related pages";
  const summaryMarker = "\n## Summary";

  const links = Array.isArray(relatedLinks) ? relatedLinks : [];
  const trimmed = links.slice(0, maxLinks);
  const bullets = trimmed.map((l) => `- [${l.title || l.slug}](/blog/${l.slug})`);
  const section = `${heading}\n\n${bullets.join("\n")}\n`;

  const existingRange = findEnBlogSectionRange(b, heading);
  if (existingRange.start >= 0 && existingRange.end > existingRange.start) {
    const existingText = b.slice(existingRange.start, existingRange.end);
    const existingCount = (existingText.match(/^- \[.*?\]\(\/blog\/[a-z0-9-]+\)/gm) || []).length;
    if (existingCount >= minLinks) return b;
    return `${b.slice(0, existingRange.start)}${section}${b.slice(existingRange.end)}`.replace(/\n{3,}/g, "\n\n");
  }

  const idx = b.indexOf(summaryMarker);
  if (idx >= 0) {
    const before = b.slice(0, idx).trimEnd();
    const after = b.slice(idx);
    return `${before}\n\n${section}${after}`.replace(/\n{3,}/g, "\n\n");
  }

  return `${b.trimEnd()}\n\n${section}`;
}

/**
 * V177 — merge new related-page bullets into existing section (dedupe by slug), cap maxLinks.
 */
function mergeEnBlogRelatedPagesSectionIntoBody(body, relatedLinks, { maxLinks = 12 } = {}) {
  const b = String(body || "");
  const heading = "## Related pages";
  const summaryMarker = "\n## Summary";
  const links = Array.isArray(relatedLinks) ? relatedLinks : [];

  const existingRange = findEnBlogSectionRange(b, heading);
  const bySlug = new Map();
  const re = /^- \[([^\]]*)\]\(\/blog\/([a-z0-9-]+)\)/gm;
  if (existingRange.start >= 0 && existingRange.end > existingRange.start) {
    const sectionText = b.slice(existingRange.start, existingRange.end);
    let m;
    while ((m = re.exec(sectionText))) {
      bySlug.set(m[2], { slug: m[2], title: String(m[1] || "").trim() });
    }
  }
  for (const l of links) {
    if (!l?.slug) continue;
    if (!bySlug.has(l.slug)) {
      bySlug.set(l.slug, { slug: l.slug, title: l.title || l.slug });
    }
  }
  const merged = [...bySlug.values()].slice(0, maxLinks);
  const bullets = merged.map((l) => `- [${l.title || l.slug}](/blog/${l.slug})`).join("\n");
  const section = `${heading}\n\n${bullets}\n`;

  if (existingRange.start >= 0 && existingRange.end > existingRange.start) {
    return `${b.slice(0, existingRange.start)}${section}${b.slice(existingRange.end)}`.replace(/\n{3,}/g, "\n\n");
  }
  const idx = b.indexOf(summaryMarker);
  if (idx >= 0) {
    const before = b.slice(0, idx).trimEnd();
    const after = b.slice(idx);
    return `${before}\n\n${section}${after}`.replace(/\n{3,}/g, "\n\n");
  }
  return `${b.trimEnd()}\n\n${section}`;
}

function upsertEnBlogRelatedPagesLink({
  blogDir,
  targetSlug,
  newSlug,
  newTitle,
  maxLinks = 10
}) {
  const targetPath = path.join(blogDir, `${targetSlug}.mdx`);
  if (!fs.existsSync(targetPath)) return false;

  const raw = fs.readFileSync(targetPath, "utf8");
  const linkHref = `/blog/${newSlug}`;
  if (raw.includes(`](${linkHref})`)) return false;

  const heading = "## Related pages";
  const summaryMarker = "\n## Summary";

  const newBullet = `- [${newTitle || newSlug}](${linkHref})`;

  // Locate existing Related pages section.
  const start = raw.indexOf(heading);
  let end = -1;
  if (start >= 0) {
    const after = raw.slice(start + heading.length);
    const nextHeadingIdx = after.indexOf("\n## ");
    end = nextHeadingIdx >= 0 ? start + heading.length + nextHeadingIdx : -1;
  }

  const linkLineRegex = /- \[[^\]]*?\]\((\/blog\/[a-z0-9-]+)\)/gi;
  const existingLinks = [];
  if (start >= 0 && end > start) {
    const sectionText = raw.slice(start, end);
    let m;
    while ((m = linkLineRegex.exec(sectionText))) {
      const href = m[1] || "";
      const slug = href.replace(/^\/blog\//, "");
      existingLinks.push(slug);
    }
  }

  // Rebuild section (insert new bullet at top).
  const unique = [newSlug, ...existingLinks.filter((s) => s !== newSlug)];
  const final = unique.slice(0, maxLinks);
  const titleBySlug = new Map();
  // Keep existing labels when possible.
  if (start >= 0 && end > start) {
    const sectionText = raw.slice(start, end);
    const linkLineRegexWithTitle = /- \[([^\]]*?)\]\((\/blog\/[a-z0-9-]+)\)/gi;
    let m2;
    while ((m2 = linkLineRegexWithTitle.exec(sectionText))) {
      const title = String(m2[1] ?? "").trim();
      const href = m2[2] || "";
      const slug = href.replace(/^\/blog\//, "");
      if (slug) titleBySlug.set(slug, title);
    }
  }

  const bullets = final.map((s) => {
    if (s === newSlug) return newBullet;
    const existingTitle = titleBySlug.get(s);
    return `- [${existingTitle || s}](/blog/${s})`;
  });

  const section = `${heading}\n\n${bullets.join("\n")}\n`;

  if (start >= 0 && end > start) {
    const before = raw.slice(0, start);
    const after = raw.slice(end);
    fs.writeFileSync(targetPath, `${before}${section}${after}`.replace(/\n{3,}/g, "\n\n"), "utf8");
    return true;
  }

  // Insert before Summary.
  const summaryIdx = raw.indexOf(summaryMarker);
  if (summaryIdx >= 0) {
    const before = raw.slice(0, summaryIdx).trimEnd();
    const after = raw.slice(summaryIdx);
    fs.writeFileSync(targetPath, `${before}\n\n${section}${after}`.replace(/\n{3,}/g, "\n\n"), "utf8");
    return true;
  }

  // Fallback: append.
  fs.writeFileSync(targetPath, `${raw.trimEnd()}\n\n${section}`, "utf8");
  return true;
}

function TOOL_MAP_EN() {
  return {
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
}

function getEnToolSlugForMeta({ platform, contentType }) {
  const key = `${platform}_${contentType}`;
  const map = TOOL_MAP_EN();
  return map[key] || "tiktok-caption-generator";
}

function labelForToolSlug(slug) {
  const m = {
    "tiktok-caption-generator": "TikTok Caption Generator",
    "youtube-title-generator": "YouTube Title Generator",
    "instagram-caption-generator": "Instagram Caption Generator",
    "title-generator": "Title Generator",
    "hashtag-generator": "Hashtag Generator",
    "hook-generator": "Hook Generator"
  };
  return m[slug] || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function computeEnRelatedToolLinksForBlogPage({ platform, contentType }, v181, v182) {
  const primary = getEnToolSlugForMeta({ platform, contentType });
  const captionSlug = getEnToolSlugForMeta({ platform, contentType: "captions" });
  const hookSlug = getEnToolSlugForMeta({ platform, contentType: "hooks" });
  const titleSlug = getEnToolSlugForMeta({ platform, contentType: "titles" });
  const hashtagSlug = getEnToolSlugForMeta({ platform, contentType: "hashtags" });
  const globalTitleSlug = "title-generator";

  // Deterministic: prioritize adjacent tools in the same workflow.
  const order = (() => {
    if (contentType === "captions" || contentType === "hooks") return [primary, hashtagSlug, hookSlug, titleSlug, captionSlug];
  if (contentType === "titles") return [primary, globalTitleSlug, hookSlug, hashtagSlug, titleSlug, captionSlug];
    // hashtags
    return [primary, captionSlug, hookSlug, titleSlug, hashtagSlug];
  })();

  const placementBoost = (v182?.placementBoostOrder || []).filter(Boolean);
  const mergedOrder = [...new Set([primary, ...placementBoost, ...order])];

  const seen = new Set();
  const out = [];
  for (const slug of mergedOrder) {
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    out.push({ href: `/tools/${slug}`, label: labelForToolSlug(slug) });
    if (out.length >= 3) break; // 1–3 tools per page
  }
  return sortToolLinksByV181Revenue(out, v181, v182);
}

function computeEnRelatedHubLinksForBlogPage(platform) {
  return [
    {
      href: `/${platform}-tools`,
      label: `${platform[0].toUpperCase()}${platform.slice(1)} tools hub`
    }
  ];
}

function computeEnRelatedAnswerLinksForBlogPage({ platform, contentType }) {
  const exclude = loadInternalLinkHardExcludes();
  const intentGroup = intentGroupForContentType(contentType);

  const captionsHooks = () => {
    const base = [];
    if (platform === "tiktok") base.push({ href: "/answers/how-to-write-tiktok-captions", label: "How to write TikTok captions" });
    if (platform === "youtube") base.push({ href: "/answers/how-to-write-youtube-hooks", label: "How to write YouTube hooks" });
    if (platform === "instagram") base.push({ href: "/answers/how-to-write-instagram-captions", label: "How to write Instagram captions" });
    base.push({ href: "/answers/how-to-write-viral-hooks", label: "Viral hooks (cross-platform)" });
    return filterHardExcludedHrefs(base.slice(0, 3), exclude).slice(0, 3);
  };

  if (intentGroup === "hashtags") {
    const base = [];
    if (platform === "tiktok") base.push({ href: "/answers/tiktok-hashtag-strategy", label: "TikTok hashtag strategy" });
    if (platform === "instagram") base.push({ href: "/answers/instagram-hashtag-strategy", label: "Instagram hashtag strategy" });
    if (platform === "youtube") base.push({ href: "/answers/tiktok-hashtag-strategy", label: "Hashtag strategy (adjacent)" });
    base.push({ href: "/answers/how-to-write-viral-hooks", label: "Viral hooks (adjacent guide)" });
    return filterHardExcludedHrefs(base.slice(0, 3), exclude).slice(0, 3);
  }

  return captionsHooks();
}

function computeEnRelatedGuideLinksForBlogPage({ platform, contentType }) {
  const intent = intentGroupForContentType(contentType);
  const guideTopics = {
    tiktok: ["grow-on-tiktok", "write-viral-captions", "create-viral-hooks", "monetize-tiktok", "increase-engagement"],
    youtube: ["get-youtube-subscribers", "grow-on-youtube-shorts", "create-viral-hooks", "write-viral-captions"],
    instagram: ["go-viral-on-instagram", "get-instagram-followers", "write-viral-captions", "create-viral-hooks"]
  };

  const ordered = (() => {
    if (intent === "caption_hooks") {
      if (contentType === "captions") return [1, 2, 0, 3, 4].map((i) => guideTopics[platform]?.[i]).filter(Boolean);
      if (contentType === "hooks") return [2, 1, 0, 3, 4].map((i) => guideTopics[platform]?.[i]).filter(Boolean);
      // titles
      return [1, 2, 0, 3, 4].map((i) => guideTopics[platform]?.[i]).filter(Boolean);
    }
    // hashtags: pick growth + captions/engagement
    return [0, 1, 2, 3, 4].map((i) => guideTopics[platform]?.[i]).filter(Boolean);
  })();

  return ordered.slice(0, 3).map((slug) => ({
    href: `/en/how-to/${slug}`,
    label: `How to ${slug.replace(/-/g, " ")}`
  }));
}

function findEnBlogSectionRange(body, heading) {
  const b = String(body || "");
  const start = b.indexOf(heading);
  if (start < 0) return { start: -1, end: -1 };
  const nextHeadingIdx = b.indexOf("\n## ", start + heading.length);
  const end = nextHeadingIdx >= 0 ? nextHeadingIdx : b.length;
  return { start, end };
}

function upsertEnBlogLinksSectionIntoBody(body, heading, links, { minLinks = 1, maxLinks = 3 } = {}) {
  const b = String(body || "");
  const { start, end } = findEnBlogSectionRange(b, heading);
  const existingCount = start >= 0 && end > start ? ((b.slice(start, end).match(/^- \[.*?\]\(/gm) || []).length) : 0;

  const safeLinks = (Array.isArray(links) ? links : []).filter(Boolean).slice(0, maxLinks);
  const sectionBullets = safeLinks.map((l) => `- [${l.label || l.href}](${l.href})`).join("\n");
  const section = `${heading}\n\n${sectionBullets}\n`;

  const summaryMarker = "\n## Summary";
  const sIdx = b.indexOf(summaryMarker);
  if (start >= 0 && end > start) {
    if (existingCount >= minLinks) return b;
    return `${b.slice(0, start)}${section}${b.slice(end)}`.replace(/\n{3,}/g, "\n\n");
  }

  if (sIdx >= 0) {
    const before = b.slice(0, sIdx).trimEnd();
    const after = b.slice(sIdx);
    return `${before}\n\n${section}${after}`.replace(/\n{3,}/g, "\n\n");
  }

  return `${b.trimEnd()}\n\n${section}`;
}

function upsertEnBlogRelatedToolsSectionIntoBody(body, requiredToolLinks, { maxLinks = 4 } = {}) {
  const b = String(body || "");
  const heading = "## Related tools";
  const { start, end } = findEnBlogSectionRange(b, heading);

  const safeRequired = Array.isArray(requiredToolLinks) ? requiredToolLinks.filter(Boolean) : [];
  const requiredHrefs = new Set(safeRequired.map((l) => l.href));

  const existing = [];
  if (start >= 0 && end > start) {
    const sectionText = b.slice(start, end);
    const re = /- \[([^\]]*?)\]\((\/tools\/[a-z0-9-]+)\)/gi;
    let m;
    while ((m = re.exec(sectionText))) {
      existing.push({ label: String(m[1] || "").trim(), href: String(m[2] || "").trim() });
    }
  }
  const existingHrefs = new Set(existing.map((x) => x.href));
  const hasAllRequired = [...requiredHrefs].every((h) => existingHrefs.has(h));
  if (hasAllRequired && existing.length > 0) return b;

  const union = [];
  const seen = new Set();
  for (const l of safeRequired) {
    if (!l?.href || seen.has(l.href)) continue;
    seen.add(l.href);
    union.push({ href: l.href, label: l.label || l.href });
  }
  for (const l of existing) {
    if (!l?.href || seen.has(l.href)) continue;
    seen.add(l.href);
    union.push(l);
  }

  const final = union.slice(0, maxLinks);
  const bullets = final.map((l) => `- [${l.label || l.href}](${l.href})`).join("\n");
  const section = `${heading}\n\n${bullets}\n`;

  const summaryMarker = "\n## Summary";
  const sIdx = b.indexOf(summaryMarker);
  if (start >= 0 && end > start) {
    return `${b.slice(0, start)}${section}${b.slice(end)}`.replace(/\n{3,}/g, "\n\n");
  }
  if (sIdx >= 0) {
    const before = b.slice(0, sIdx).trimEnd();
    const after = b.slice(sIdx);
    return `${before}\n\n${section}${after}`.replace(/\n{3,}/g, "\n\n");
  }
  return `${b.trimEnd()}\n\n${section}`;
}

module.exports = {
  buildEnBlogLinkIndex,
  addEnBlogFpToLinkIndex,
  selectEnBlogRelatedPageSlugs,
  loadSearchLinkPriority,
  loadV176LinkWeights,
  loadV181LinkWeights,
  loadV182EntryBoost,
  blogSlugToPrimaryToolSlug,
  sortToolLinksByV181Revenue,
  loadInternalLinkHardExcludes,
  filterHardExcludedHrefs,
  sortBlogSlugsForBacklinks,
  extractEnBlogTitleFromMdx,
  injectEnBlogRelatedPagesSectionIntoBody,
  upsertEnBlogRelatedPagesSectionIntoBody,
  mergeEnBlogRelatedPagesSectionIntoBody,
  findEnBlogSectionRange,
  upsertEnBlogRelatedPagesLink,
  computeEnRelatedToolLinksForBlogPage,
  computeEnRelatedAnswerLinksForBlogPage,
  computeEnRelatedGuideLinksForBlogPage,
  computeEnRelatedHubLinksForBlogPage,
  upsertEnBlogLinksSectionIntoBody,
  upsertEnBlogRelatedToolsSectionIntoBody
};

