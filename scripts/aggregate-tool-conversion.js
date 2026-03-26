#!/usr/bin/env node
/**
 * V108: Aggregate generated/tool-click-events.jsonl → tool-conversion-map.json
 * Run after collecting events (batch / cron).
 *
 * Usage: node scripts/aggregate-tool-conversion.js
 */

const fs = require("fs");
const path = require("path");

const IN_PATH = path.join(process.cwd(), "generated", "tool-click-events.jsonl");
const OUT_PATH = path.join(process.cwd(), "generated", "tool-conversion-map.json");

function ensureDir(p) {
  const d = path.dirname(p);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function readLines(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf8");
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function topTools(map, n = 5) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([tool]) => tool);
}

function main() {
  const events = readLines(IN_PATH);
  const toolClicks = new Map(); // blogSlug -> Map tool -> count
  const toolEntries = new Map();

  for (const e of events) {
    if (e.type === "tool_click" && e.sourceSlug && e.toolSlug) {
      if (!toolClicks.has(e.sourceSlug)) toolClicks.set(e.sourceSlug, new Map());
      const m = toolClicks.get(e.sourceSlug);
      m.set(e.toolSlug, (m.get(e.toolSlug) || 0) + 1);
    }
    if (e.type === "tool_entry" && e.sourceKind === "internal_blog" && e.sourceSlug && e.toolSlug) {
      if (!toolEntries.has(e.sourceSlug)) toolEntries.set(e.sourceSlug, new Map());
      const m = toolEntries.get(e.sourceSlug);
      m.set(e.toolSlug, (m.get(e.toolSlug) || 0) + 1);
    }
  }

  const allBlogs = new Set([...toolClicks.keys(), ...toolEntries.keys()]);
  const blogs = {};

  for (const blogSlug of allBlogs) {
    const tc = toolClicks.get(blogSlug) || new Map();
    const te = toolEntries.get(blogSlug) || new Map();
    const toolClicksObj = Object.fromEntries(tc);
    const toolEntriesObj = Object.fromEntries(te);
    const clicksTotal = [...tc.values()].reduce((a, b) => a + b, 0);
    const entriesTotal = [...te.values()].reduce((a, b) => a + b, 0);
    const combined = new Map();
    for (const [tool, n] of tc) combined.set(tool, (combined.get(tool) || 0) + n);
    for (const [tool, n] of te) combined.set(tool, (combined.get(tool) || 0) + n);
    blogs[blogSlug] = {
      toolClicks: toolClicksObj,
      toolEntries: toolEntriesObj,
      toolClicksTotal: clicksTotal,
      toolEntriesTotal: entriesTotal,
      topTools: topTools(combined, 8),
      score: clicksTotal + 3 * entriesTotal
    };
  }

  const scored = Object.entries(blogs)
    .map(([slug, b]) => ({ slug, ...b }))
    .sort((a, b) => b.score - a.score);

  const high = [];
  const low = [];

  for (const row of scored) {
    const { slug, toolClicksTotal: tc, toolEntriesTotal: te, score } = row;
    if (score >= 5 || te >= 2 || (te >= 1 && tc >= 2)) {
      high.push(slug);
    } else if (tc >= 4 && te === 0) {
      low.push(slug);
    } else if (score <= 1 && tc >= 3) {
      low.push(slug);
    }
  }

  const decisions = {
    expandSimilarTopics: high.slice(0, 12),
    prioritizeCtrOnBlogs: low.slice(0, 20),
    noteInternalLinking:
      "high_conversion_pages merged into search link priority; low_conversion_pages penalized unless overridden by search winners."
  };

  const out = {
    updatedAt: new Date().toISOString(),
    eventCount: events.length,
    blogs,
    classification: {
      high_conversion_pages: high,
      low_conversion_pages: low
    },
    decisions
  };

  ensureDir(OUT_PATH);
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), "utf8");
  console.log(`[aggregate-tool-conversion] blogs=${Object.keys(blogs).length} high=${high.length} low=${low.length} → ${OUT_PATH}`);
}

main();
