/**
 * V172 — Pre-generation gates, retrieval prompt block, dedup (server-side).
 */

import fs from "fs";
import path from "path";

export type HighQualitySignalsDoc = {
  version?: string;
  min_pregen_score?: number;
  generation_strict?: boolean;
  topic_demote?: string[];
  tool_signals?: {
    high_quality_tools?: string[];
    unstable_tools?: string[];
    low_quality_tools?: string[];
  };
  reference_snippets?: {
    topic: string;
    workflow?: string;
    summary: string;
    quality_score?: number;
  }[];
};

export type ContentDedupDoc = {
  version?: string;
  title_similarity_threshold_blog?: number;
  title_similarity_threshold_topic?: number;
  titles?: { slug: string; title: string; normalized: string }[];
};

function safeReadJson<T>(p: string): T | null {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8")) as T;
  } catch {
    return null;
  }
}

export function loadHighQualitySignals(cwd: string = process.cwd()): HighQualitySignalsDoc | null {
  return safeReadJson<HighQualitySignalsDoc>(path.join(cwd, "generated", "high-quality-signals.json"));
}

export function loadContentDedup(cwd: string = process.cwd()): ContentDedupDoc | null {
  return safeReadJson<ContentDedupDoc>(path.join(cwd, "generated", "content-deduplication.json"));
}

/** Strict path: no heuristic packages when model output is unusable (unless legacy env). */
export function isV172StrictMode(cwd: string = process.cwd()): boolean {
  if (process.env.TOOLEAGLE_V172_LEGACY_FALLBACK === "1") return false;
  const h = loadHighQualitySignals(cwd);
  if (!h) return false;
  return h.generation_strict !== false;
}

function normalizeTopic(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(s: string): Set<string> {
  return new Set(normalizeTopic(s).split(" ").filter((w) => w.length > 2));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

export function evaluatePregenGate(
  userInput: string,
  opts: { toolSlug?: string; v186Boost?: boolean } | undefined,
  cwd: string = process.cwd()
): { allowed: boolean; score: number; reason: string } {
  const h = loadHighQualitySignals(cwd);
  if (!h) return { allowed: true, score: 0.5, reason: "no_signals_file" };

  const min = h.min_pregen_score ?? 0.08;
  let score = 0.22;
  if (opts?.v186Boost) score += 0.18;
  const t = userInput.toLowerCase();
  const words = new Set(t.split(/\W+/).filter((w) => w.length > 3));

  let overlapBoost = 0;
  for (const s of (h.reference_snippets ?? []).slice(0, 48)) {
    const topic = (s.topic || "").toLowerCase();
    const summary = (s.summary || "").toLowerCase();
    if (topic && (t.includes(topic) || words.has(topic))) {
      overlapBoost += 0.08;
      continue;
    }
    let wHit = 0;
    for (const w of words) {
      if (w.length < 4) continue;
      if (topic.includes(w) || summary.includes(w)) wHit++;
    }
    overlapBoost += Math.min(0.07, wHit * 0.014);
  }
  score += Math.min(0.45, overlapBoost);

  for (const d of h.topic_demote ?? []) {
    const dl = String(d).toLowerCase().replace(/^\/+|\/+$/g, "");
    if (!dl) continue;
    if (t.includes(dl) || t.replace(/\//g, "").includes(dl.replace(/\//g, ""))) score -= 0.16;
  }

  const unstable = h.tool_signals?.unstable_tools ?? [];
  if (opts?.toolSlug && unstable.includes(opts.toolSlug)) score -= 0.07;

  score = Math.max(0, Math.min(1, score));
  if (score < min) return { allowed: false, score, reason: "below_pregen_threshold" };
  return { allowed: true, score, reason: "ok" };
}

export function checkContentDedup(
  userInput: string,
  cwd: string = process.cwd(),
  mode: "blog" | "topic" = "topic"
): { blocked: boolean; similarSlug?: string; similarity?: number } {
  const doc = loadContentDedup(cwd);
  const rows = doc?.titles;
  if (!rows?.length) return { blocked: false };

  const threshold =
    mode === "blog"
      ? (doc?.title_similarity_threshold_blog ?? 0.55)
      : (doc?.title_similarity_threshold_topic ?? 0.82);

  const norm = normalizeTopic(userInput);
  const inputTokens = tokenSet(norm);
  if (inputTokens.size === 0) return { blocked: false };

  for (const row of rows) {
    const sim = jaccard(inputTokens, tokenSet(row.normalized));
    if (sim >= threshold) return { blocked: true, similarSlug: row.slug, similarity: sim };
  }
  return { blocked: false };
}

type RawRetrieval = { items?: { topic?: string; normalized_topic?: string; workflow?: string; content_summary?: string; quality_score?: number }[] };

export function buildRetrievalReferenceBlock(
  userInput: string,
  locale: string,
  cwd: string = process.cwd(),
  topN = 5
): { block: string; snippetCount: number; usedSignalsFile: boolean } {
  const h = loadHighQualitySignals(cwd);
  let pool = h?.reference_snippets;
  let usedSignalsFile = !!pool?.length;

  if (!pool?.length) {
    const raw = safeReadJson<RawRetrieval>(path.join(cwd, "generated", "workflow-assets-retrieval.json"));
    const items = raw?.items ?? [];
    pool = items
      .slice()
      .sort((a, b) => (b.quality_score ?? 0) - (a.quality_score ?? 0))
      .slice(0, 28)
      .map((it) => ({
        topic: String(it.normalized_topic || it.topic || "").trim(),
        workflow: it.workflow,
        summary: String(it.content_summary || "").trim(),
        quality_score: Number(it.quality_score) || 0
      }))
      .filter((x) => x.topic || x.summary);
    usedSignalsFile = false;
  }

  const zh = locale === "zh" || locale.startsWith("zh");
  if (!pool.length) {
    return {
      block: zh
        ? "【V172 参考】暂无检索条目；仍须输出完整、可执行的 JSON 包，禁止泛泛占位模板。"
        : "REFERENCE_SNIPPETS (V172): No retrieval rows on disk yet. Still output concrete, niche-specific packages — forbid generic placeholder templates.",
      snippetCount: 0,
      usedSignalsFile
    };
  }

  const words = new Set(userInput.toLowerCase().split(/\W+/).filter((w) => w.length > 2));
  const scored = pool.map((s) => {
    let sc = s.quality_score ?? 0;
    const blob = `${s.topic} ${s.summary}`.toLowerCase();
    for (const w of words) {
      if (w.length > 3 && blob.includes(w)) sc += 0.11;
    }
    return { s, sc };
  });
  scored.sort((a, b) => b.sc - a.sc);
  const picks = scored.slice(0, topN).map((x) => x.s);

  const header = zh
    ? "【V172 高质检索参考】下列为站内高检索摘要，请学习结构与信息密度，禁止原句抄袭："
    : "REFERENCE_SNIPPETS (V172 — high-retrieval summaries). Learn structure and specificity; do NOT copy verbatim:";

  const lines = picks.map(
    (s, i) => `${i + 1}. [${s.workflow || "studio"} · ${s.topic || "topic"}] ${s.summary || ""}`.trim()
  );

  return {
    block: `${header}\n${lines.join("\n")}`,
    snippetCount: picks.length,
    usedSignalsFile
  };
}
