#!/usr/bin/env node
/**
 * V109: Aggregate generated/tool-output-actions.jsonl → tool-output-quality.json
 */

const fs = require("fs");
const path = require("path");

const IN_PATH = path.join(process.cwd(), "generated", "tool-output-actions.jsonl");
const OUT_PATH = path.join(process.cwd(), "generated", "tool-output-quality.json");

function readLines(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs
    .readFileSync(filePath, "utf8")
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

function main() {
  const events = readLines(IN_PATH);

  /** @type {Record<string, { copies: number, generations: number, regenerations: number, sessions: Set<string>, copyByType: Record<string, number> }>} */
  const byTool = {};

  function ensure(slug) {
    if (!byTool[slug]) {
      byTool[slug] = {
        copies: 0,
        generations: 0,
        regenerations: 0,
        sessions: new Set(),
        copyByType: {}
      };
    }
    return byTool[slug];
  }

  for (const e of events) {
    const slug = e.toolSlug;
    if (!slug || typeof slug !== "string") continue;

    if (e.type === "output_copy") {
      const t = ensure(slug);
      t.copies += 1;
      const rt = e.resultType || "block";
      t.copyByType[rt] = (t.copyByType[rt] || 0) + 1;
      if (e.sessionId) t.sessions.add(String(e.sessionId));
    }
    if (e.type === "generation_complete") {
      const t = ensure(slug);
      t.generations += 1;
      if (e.wasRegenerate) t.regenerations += 1;
      if (e.sessionId) t.sessions.add(String(e.sessionId));
    }
  }

  const tools = {};
  const slugs = Object.keys(byTool).sort();

  for (const slug of slugs) {
    const raw = byTool[slug];
    const generations = raw.generations;
    const copies = raw.copies;
    const regenerations = raw.regenerations;
    const sessionCount = raw.sessions.size || 1;
    const copyRate = generations > 0 ? copies / generations : 0;
    const regenRatio = generations > 0 ? regenerations / generations : 0;
    const regenerationRate = sessionCount > 0 ? regenerations / sessionCount : 0;
    /** Quality score: copies per gen weighted down by regen pressure */
    const qualityScore = copyRate * (1 - 0.5 * Math.min(1, regenRatio));

    tools[slug] = {
      copies,
      generations,
      regenerations,
      sessionCount,
      copyRate: Math.round(copyRate * 1000) / 1000,
      regenRatio: Math.round(regenRatio * 1000) / 1000,
      regenerationRate: Math.round(regenerationRate * 1000) / 1000,
      copyByType: raw.copyByType,
      qualityScore: Math.round(qualityScore * 1000) / 1000
    };
  }

  const ranked = slugs
    .map((slug) => ({ slug, ...tools[slug] }))
    .filter((r) => r.generations >= 1)
    .sort((a, b) => b.qualityScore - a.qualityScore);

  const high_quality_tools = [];
  const unstable_tools = [];
  const low_quality_tools = [];

  for (const row of ranked) {
    const { copyRate: cr, regenRatio: rr, generations: g } = row;
    if (g < 3) {
      unstable_tools.push(row.slug);
      continue;
    }
    if (cr >= 0.35 && rr <= 0.35) high_quality_tools.push(row.slug);
    else if (rr >= 0.55 || (cr < 0.12 && rr >= 0.25)) low_quality_tools.push(row.slug);
    else if (rr >= 0.4 || (cr < 0.2 && rr >= 0.2)) unstable_tools.push(row.slug);
    else if (cr >= 0.25 && rr <= 0.45) high_quality_tools.push(row.slug);
    else unstable_tools.push(row.slug);
  }

  const needsImprovement = [
    ...new Set([...low_quality_tools, ...unstable_tools.filter((s) => !high_quality_tools.includes(s))])
  ].slice(0, 25);

  const goodEnough = high_quality_tools.filter((s) => !low_quality_tools.includes(s)).slice(0, 20);

  const out = {
    updatedAt: new Date().toISOString(),
    eventCount: events.length,
    tools,
    classification: {
      high_quality_tools,
      unstable_tools,
      low_quality_tools
    },
    decisions: {
      prioritizeImprovement: needsImprovement,
      goodEnough,
      note:
        "Use copyRate vs regenRatio from `tools`; prioritizeImprovement is heuristic from buckets. No UI — batch only."
    }
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), "utf8");
  console.log(
    `[aggregate-tool-output-quality] tools=${slugs.length} ranked=${ranked.length} → ${OUT_PATH}`
  );
}

main();
