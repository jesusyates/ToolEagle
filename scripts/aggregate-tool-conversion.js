#!/usr/bin/env node
/**
 * V108 + V175: Aggregate generated/tool-click-events.jsonl (+ tool-output-actions) → tool-conversion-map.json
 * Run after collecting events (batch / cron).
 *
 * Usage: node scripts/aggregate-tool-conversion.js
 */

const fs = require("fs");
const path = require("path");

const IN_PATH = path.join(process.cwd(), "generated", "tool-click-events.jsonl");
const OUT_ACTIONS = path.join(process.cwd(), "generated", "tool-output-actions.jsonl");
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
  const toolClicks = new Map();
  const toolEntries = new Map();

  /** Per-blog funnel (sourceSlug = blog slug when present). */
  const funnelByBlog = new Map();

  function bumpFunnelBlog(sourceSlug, key, delta = 1) {
    if (!sourceSlug || typeof sourceSlug !== "string") return;
    if (!funnelByBlog.has(sourceSlug)) {
      funnelByBlog.set(sourceSlug, {
        tool_click: 0,
        copy: 0,
        generation_complete: 0,
        publish_redirect_click: 0,
        tool_entry: 0
      });
    }
    const o = funnelByBlog.get(sourceSlug);
    o[key] = (o[key] || 0) + delta;
  }

  const funnelTotals = {
    tool_click: 0,
    tool_entry: 0,
    copy: 0,
    generation_complete: 0,
    publish_redirect_click: 0
  };

  for (const e of events) {
    const t = e.type;
    if (t === "tool_click" && e.sourceSlug && e.toolSlug) {
      if (!toolClicks.has(e.sourceSlug)) toolClicks.set(e.sourceSlug, new Map());
      const m = toolClicks.get(e.sourceSlug);
      m.set(e.toolSlug, (m.get(e.toolSlug) || 0) + 1);
      funnelTotals.tool_click += 1;
      bumpFunnelBlog(e.sourceSlug, "tool_click");
    }
    if (t === "tool_entry" && e.sourceKind === "internal_blog" && e.sourceSlug && e.toolSlug) {
      if (!toolEntries.has(e.sourceSlug)) toolEntries.set(e.sourceSlug, new Map());
      const m = toolEntries.get(e.sourceSlug);
      m.set(e.toolSlug, (m.get(e.toolSlug) || 0) + 1);
      funnelTotals.tool_entry += 1;
      bumpFunnelBlog(e.sourceSlug, "tool_entry");
    }
    if (t === "tool_copy" && e.toolSlug) {
      funnelTotals.copy += 1;
      bumpFunnelBlog(e.sourceSlug, "copy");
    }
    if (t === "publish_redirect_click" && e.toolSlug) {
      funnelTotals.publish_redirect_click += 1;
      bumpFunnelBlog(e.sourceSlug, "publish_redirect_click");
    }
    if (t === "generation_complete" && e.toolSlug) {
      funnelTotals.generation_complete += 1;
      bumpFunnelBlog(e.sourceSlug, "generation_complete");
    }
  }

  /** Merge copy + generation signals from tool-output-actions (server / client quality pipeline). */
  const actionEvents = readLines(OUT_ACTIONS);
  let outputCopyTotal = 0;
  let generationCompleteTotal = 0;
  const genByTool = new Map();
  const copyByTool = new Map();

  for (const e of actionEvents) {
    const slug = e.toolSlug;
    if (!slug || typeof slug !== "string") continue;
    if (e.type === "output_copy") {
      outputCopyTotal += 1;
      copyByTool.set(slug, (copyByTool.get(slug) || 0) + 1);
    }
    if (e.type === "generation_complete") {
      generationCompleteTotal += 1;
      genByTool.set(slug, (genByTool.get(slug) || 0) + 1);
    }
  }

  funnelTotals.copy += outputCopyTotal;
  funnelTotals.generation_complete += generationCompleteTotal;

  const allBlogs = new Set([...toolClicks.keys(), ...toolEntries.keys(), ...funnelByBlog.keys()]);
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

    const funnel = funnelByBlog.get(blogSlug) || {
      tool_click: 0,
      copy: 0,
      generation_complete: 0,
      publish_redirect_click: 0,
      tool_entry: 0
    };

    blogs[blogSlug] = {
      toolClicks: toolClicksObj,
      toolEntries: toolEntriesObj,
      toolClicksTotal: clicksTotal,
      toolEntriesTotal: entriesTotal,
      topTools: topTools(combined, 8),
      score: clicksTotal + 3 * entriesTotal,
      funnel: {
        tool_click: funnel.tool_click,
        copy: funnel.copy,
        generation_complete: funnel.generation_complete,
        publish_redirect_click: funnel.publish_redirect_click,
        tool_entry: funnel.tool_entry
      }
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
    version: "175",
    updatedAt: new Date().toISOString(),
    eventCount: events.length,
    funnel_totals: funnelTotals,
    funnel_sources: {
      tool_click_events_jsonl: IN_PATH,
      tool_output_actions_jsonl: fs.existsSync(OUT_ACTIONS) ? OUT_ACTIONS : null,
      note:
        "copy and generation_complete include tool-click-events (client funnel) plus output_copy/generation_complete from tool-output-actions.jsonl when present."
    },
    tool_output_quality_rollup: {
      output_copy_events: outputCopyTotal,
      generation_complete_events: generationCompleteTotal,
      by_tool_generations: Object.fromEntries([...genByTool.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40)),
      by_tool_copies: Object.fromEntries([...copyByTool.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40))
    },
    blogs,
    classification: {
      high_conversion_pages: high,
      low_conversion_pages: low
    },
    decisions
  };

  ensureDir(OUT_PATH);
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), "utf8");
  console.log(
    `[aggregate-tool-conversion] blogs=${Object.keys(blogs).length} high=${high.length} low=${low.length} funnel=${JSON.stringify(
      funnelTotals
    )} → ${OUT_PATH}`
  );
}

main();
