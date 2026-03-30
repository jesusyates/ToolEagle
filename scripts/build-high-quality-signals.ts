#!/usr/bin/env npx tsx
/**
 * V172 — Merge retrieval + growth + tool quality into generated/high-quality-signals.json
 * for pre-generation scoring and prompt conditioning.
 */

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "generated", "high-quality-signals.json");

type RetrievalItem = {
  id?: string;
  topic?: string;
  normalized_topic?: string;
  workflow?: string;
  content_summary?: string;
  quality_score?: number;
};

function readJson<T>(p: string): T | null {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8")) as T;
  } catch {
    return null;
  }
}

function main() {
  const retrievalPath = path.join(ROOT, "generated", "workflow-assets-retrieval.json");
  const growthPath = path.join(ROOT, "generated", "growth-priority.json");
  const toolQPath = path.join(ROOT, "generated", "tool-output-quality.json");

  const retrieval = readJson<{ items?: RetrievalItem[] }>(retrievalPath);
  const items = Array.isArray(retrieval?.items) ? retrieval!.items! : [];
  const sorted = [...items].sort((a, b) => (b.quality_score ?? 0) - (a.quality_score ?? 0));
  const reference_snippets = sorted.slice(0, 36).map((it) => ({
    id: it.id ?? "",
    topic: String(it.normalized_topic || it.topic || "").trim(),
    workflow: it.workflow,
    summary: String(it.content_summary || "").trim(),
    quality_score: Number(it.quality_score) || 0
  }));

  const growth = readJson<{
    decisions?: { reduceFocusSlugs?: string[] };
    underperformingBlogs?: { slug?: string }[];
  }>(growthPath);

  const topic_demote = new Set<string>();
  for (const s of growth?.decisions?.reduceFocusSlugs ?? []) {
    if (s) topic_demote.add(String(s));
  }
  for (const b of growth?.underperformingBlogs ?? []) {
    if (b?.slug) topic_demote.add(String(b.slug));
  }

  const toolQ = readJson<{
    classification?: { high_quality_tools?: string[]; unstable_tools?: string[]; low_quality_tools?: string[] };
  }>(toolQPath);

  const doc = {
    version: "172",
    builtAt: new Date().toISOString(),
    min_pregen_score: 0.08,
    generation_strict: true,
    sources: {
      workflow_assets_retrieval: fs.existsSync(retrievalPath),
      growth_priority: fs.existsSync(growthPath),
      tool_output_quality: fs.existsSync(toolQPath),
      gsc_history: false
    },
    topic_demote: [...topic_demote],
    tool_signals: {
      high_quality_tools: toolQ?.classification?.high_quality_tools ?? [],
      unstable_tools: toolQ?.classification?.unstable_tools ?? [],
      low_quality_tools: toolQ?.classification?.low_quality_tools ?? []
    },
    reference_snippet_count: reference_snippets.length,
    reference_snippets
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(doc, null, 2), "utf8");
  console.log("[build-high-quality-signals]", OUT, doc.reference_snippet_count, "snippets");
}

main();
