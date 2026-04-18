import fs from "node:fs";
import path from "node:path";

export type SeoHistoryLedgerItem = {
  id: string;
  title: string;
  slug: string;
  status: "published";
  topicKey: string;
  intent: string;
  summary: string;
  keywords: string[];
  angle: string;
  duplicateRiskHints: string[];
};

export type SeoHistoryLedger = {
  updatedAt: string;
  totalPublished: number;
  items: SeoHistoryLedgerItem[];
};

const LEDGER_REL_PATH = path.join("generated", "seo-history-ledger.json");

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "for",
  "to",
  "of",
  "in",
  "on",
  "with",
  "your",
  "you",
  "how",
  "what",
  "when",
  "why",
  "is",
  "are",
  "was",
  "be",
  "by",
  "at",
  "it",
  "its",
  "this",
  "that",
  "from",
  "as",
  "into",
  "about"
]);

/** Topic key for dedupe (aligned with automation pipeline). */
export function normalizeTopicKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/\bhow to\b/g, "")
    .replace(/\bbest\b/g, "")
    .replace(/\bexamples?\b/g, "")
    .replace(/\bcompared\b/g, "")
    .replace(/\bvs\b/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function inferLedgerIntent(title: string): string {
  const lower = title.toLowerCase();
  if (lower.startsWith("how to")) return "instructional";
  if (lower.includes(" vs ") || lower.includes("compared") || /\bbest\b/i.test(title)) return "comparison";
  if (lower.includes("example")) return "examples";
  return "informational";
}

export function inferLedgerAngle(title: string): string {
  const lower = title.toLowerCase();
  if (lower.startsWith("how to")) return "step-by-step";
  if (lower.includes(" vs ") || lower.includes("compared") || /\bbest\b/i.test(title)) return "comparison";
  if (lower.includes("example")) return "example-driven";
  return "informational explainer";
}

export function buildDuplicateRiskHintsForTitle(title: string): string[] {
  const intent = inferLedgerIntent(title);
  const hints = [
    "avoid repeating the same title framing",
    "do not regenerate the same comparison angle",
    "avoid near-duplicate intro structure"
  ];
  if (intent === "comparison") hints.push("avoid repeating the same comparison criteria");
  if (intent === "examples") hints.push("avoid repeating the same example framing");
  return [...new Set(hints)];
}

export function extractKeywordsFromTitle(title: string, min = 3, max = 8): string[] {
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of words) {
    if (seen.has(w)) continue;
    seen.add(w);
    out.push(w);
    if (out.length >= max) break;
  }
  while (out.length < min && words.length > out.length) {
    for (const w of words) {
      if (out.includes(w)) continue;
      out.push(w);
      if (out.length >= min) break;
    }
    break;
  }
  return out.slice(0, max);
}

function firstPlainSnippetFromContent(content: string, maxChars = 400): string {
  const t = content
    .replace(/^#+\s+.+$/gm, "")
    .replace(/```[\s\S]*?```/g, " ")
    .trim();
  const parts = t
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !p.startsWith("#") && !p.startsWith(">"));
  let out = "";
  for (const p of parts) {
    const line = p.replace(/\n/g, " ").trim();
    if (line.length < 20) continue;
    if (out.length + line.length > maxChars) {
      if (!out) out = line.slice(0, maxChars);
      break;
    }
    out += (out ? " " : "") + line;
  }
  return out.trim();
}

export function buildLedgerSummary(input: {
  title: string;
  description?: string | null;
  contentSnippet?: string;
  intent: string;
  angle: string;
}): string {
  const reader = "creators, marketers, and small business readers";
  const baseTitle = input.title.replace(/\s+/g, " ").trim();
  const desc = (input.description || "").trim().replace(/\s+/g, " ");
  const snip = (input.contentSnippet || "").trim();
  const context = desc || snip;
  if (context.length > 0) {
    const ctx = context.length > 280 ? `${context.slice(0, 277)}…` : context;
    return `This article explains ${baseTitle} for ${reader}. It focuses on a ${input.angle} angle (${input.intent} intent). Context: ${ctx}`;
  }
  return `This article explains ${baseTitle} for ${reader}. It focuses on a ${input.angle} angle and ${input.intent} search intent.`;
}

export function emptySeoHistoryLedger(): SeoHistoryLedger {
  return {
    updatedAt: new Date().toISOString(),
    totalPublished: 0,
    items: []
  };
}

export function readSeoHistoryLedger(repoRoot: string = process.cwd()): SeoHistoryLedger {
  const fp = path.join(repoRoot, LEDGER_REL_PATH);
  try {
    const raw = fs.readFileSync(fp, "utf8");
    const data = JSON.parse(raw) as Partial<SeoHistoryLedger>;
    if (!data || typeof data !== "object") return emptySeoHistoryLedger();
    const items = Array.isArray(data.items) ? data.items : [];
    return {
      updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : new Date().toISOString(),
      totalPublished:
        typeof data.totalPublished === "number" ? data.totalPublished : items.filter(isLedgerItemShape).length,
      items: items.filter(isLedgerItemShape).map(normalizeLedgerItem)
    };
  } catch {
    return emptySeoHistoryLedger();
  }
}

function isLedgerItemShape(x: unknown): x is Record<string, unknown> {
  return Boolean(x && typeof x === "object" && typeof (x as { title?: unknown }).title === "string");
}

function normalizeLedgerItem(row: Record<string, unknown>): SeoHistoryLedgerItem {
  const title = String(row.title ?? "").trim();
  const id = String(row.id ?? "").trim();
  const slug = String(row.slug ?? "").trim();
  const topicKey = String(row.topicKey ?? "").trim() || normalizeTopicKey(title);
  const intent = String(row.intent ?? inferLedgerIntent(title));
  const angle = String(row.angle ?? inferLedgerAngle(title));
  let summary = String(row.summary ?? "").trim();
  if (!summary) {
    summary = buildLedgerSummary({ title, intent, angle });
  }
  const keywords = Array.isArray(row.keywords)
    ? (row.keywords as unknown[]).map((k) => String(k).trim()).filter(Boolean)
    : extractKeywordsFromTitle(title);
  const hints = Array.isArray(row.duplicateRiskHints)
    ? (row.duplicateRiskHints as unknown[]).map((h) => String(h).trim()).filter(Boolean)
    : buildDuplicateRiskHintsForTitle(title);
  return {
    id,
    title,
    slug,
    status: "published",
    topicKey,
    intent,
    summary,
    keywords,
    angle,
    duplicateRiskHints: hints.length ? hints : buildDuplicateRiskHintsForTitle(title)
  };
}

/** Published row from DB (script). */
export type SeoArticlePublishedRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  description: string | null;
  content: string;
};

export function articleRowToLedgerItem(row: SeoArticlePublishedRow): SeoHistoryLedgerItem {
  const title = (row.title || "").trim();
  const intent = inferLedgerIntent(title);
  const angle = inferLedgerAngle(title);
  const snippet = firstPlainSnippetFromContent(row.content || "", 450);
  const summary = buildLedgerSummary({
    title,
    description: row.description,
    contentSnippet: snippet,
    intent,
    angle
  });
  return {
    id: String(row.id),
    title,
    slug: row.slug,
    status: "published",
    topicKey: normalizeTopicKey(title),
    intent,
    summary,
    keywords: extractKeywordsFromTitle(title),
    angle,
    duplicateRiskHints: buildDuplicateRiskHintsForTitle(title)
  };
}

export function buildUsedTopicKeySetFromLedger(ledger: SeoHistoryLedger): Set<string> {
  const set = new Set<string>();
  for (const it of ledger.items) {
    const k = (it.topicKey || "").trim() || normalizeTopicKey(it.title);
    if (k) set.add(k);
  }
  return set;
}

/** Title-only keys from published corpus rows when ledger file is empty (no full-body scan). */
export function buildTopicKeySetFromPublishedTitles(rows: Array<{ title?: string }>): Set<string> {
  const set = new Set<string>();
  for (const item of rows) {
    const title = (item.title || "").trim();
    if (!title) continue;
    const k = normalizeTopicKey(title);
    if (k) set.add(k);
  }
  return set;
}

/**
 * Pick ledger entries most relevant to the candidate title (topicKey / token overlap), max 5–10.
 */
export function matchLedgerItemsForTopic(
  title: string,
  ledger: SeoHistoryLedger,
  maxItems = 10
): SeoHistoryLedgerItem[] {
  if (!ledger.items.length) return [];
  const k = normalizeTopicKey(title);
  if (!k) return [];

  const queryWords = new Set(k.split(" ").filter((w) => w.length > 0));

  const scored = ledger.items.map((item, idx) => {
    const ik = (item.topicKey || "").trim() || normalizeTopicKey(item.title);
    let score = 0;
    if (ik && ik === k) score += 100;
    if (ik && (ik.includes(k) || k.includes(ik))) score += 50;
    const iw = new Set(ik.split(" ").filter((w) => w.length > 2));
    let inter = 0;
    for (const w of queryWords) {
      if (w.length <= 2) continue;
      if (iw.has(w)) inter++;
    }
    const u = queryWords.size + iw.size - inter;
    if (u > 0) score += (inter / u) * 40;
    for (const kw of item.keywords || []) {
      const nk = normalizeTopicKey(kw);
      if (nk && (k.includes(nk) || nk.includes(k) || queryWords.has(kw.toLowerCase()))) score += 8;
    }
    return { item, score, idx };
  });

  scored.sort((a, b) => b.score - a.score || a.idx - b.idx);
  return scored.filter((s) => s.score >= 5).slice(0, maxItems).map((s) => s.item);
}

export function ledgerRelativePath(): string {
  return LEDGER_REL_PATH;
}
