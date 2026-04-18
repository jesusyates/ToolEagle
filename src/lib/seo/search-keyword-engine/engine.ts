import { enContentTokenJaccard } from "../title-dedup-tokens";
import { fetchGoogleSuggestQueries } from "../search-data-engine/google-suggest";
import type { SearchDemandIntent } from "../search-data-engine/types";
import { inferSearchDemandIntent } from "../search-data-engine/search-style-gate";
import type { SearchKeywordEngineRow, SearchKeywordPublicIntent, TopicEngineKeywordRow } from "./types";

/** Default base terms to expand (edit / pass overrides in runner). */
export const DEFAULT_SEARCH_BASE_TERMS: string[] = [
  "AI writing",
  "blog writing",
  "content tools",
  "AI blog posts",
  "marketing copy",
  "AI copywriting",
  "long form content",
  "social media captions",
  "email marketing copy",
  "landing page copy"
];

const STOP = new Set([
  "a",
  "an",
  "the",
  "for",
  "to",
  "of",
  "and",
  "or",
  "in",
  "on",
  "with",
  "at",
  "by",
  "as",
  "is",
  "are",
  "that",
  "this",
  "your",
  "you",
  "how",
  "what",
  "when",
  "why",
  "from",
  "into",
  "vs",
  "without"
]);

/** Map internal classifier to public intent buckets. */
export function mapToPublicIntent(internal: SearchDemandIntent): SearchKeywordPublicIntent {
  switch (internal) {
    case "how_to":
      return "how_to";
    case "comparison":
    case "alternatives":
      return "comparison";
    case "examples":
      return "examples";
    case "templates":
    case "tools":
      return "list";
    default:
      return "how_to";
  }
}

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function specificityScore(phrase: string): number {
  const parts = phrase
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9]/g, ""))
    .filter((w) => w.length > 0 && !STOP.has(w));
  let score = 0;
  for (const w of parts) {
    if (w.length >= 6) score += 2;
    else if (w.length >= 4) score += 1;
  }
  return score;
}

/**
 * Critical filter: long-tail (4–8 words), clear intent token, reject vague / naked generics.
 */
export function passesSearchKeywordEngineFilter(keyword: string): boolean {
  const t = keyword.replace(/\s+/g, " ").trim();
  if (!t) return false;
  const low = t.toLowerCase();
  const wc = wordCount(t);
  if (wc < 4 || wc > 8) return false;
  if (t.length < 28 || t.length > 100) return false;

  if (/\btips for\b/i.test(t)) return false;
  if (/^guide to\b/i.test(low)) return false;
  if (/\bhow creators\b/i.test(t)) return false;
  if (/\bcreators use\b/i.test(t)) return false;
  if (/\bfor creators\b/i.test(t)) return false;
  if (/\bgeneric creator\b/i.test(t)) return false;
  if (/\bexplained\s*$/i.test(t)) return false;

  if (!/\b(how to|best|vs|versus|alternatives to|examples?|templates?)\b/i.test(t)) return false;

  if (/^(ai tools?|blog writing|content tools?|ai writing|ai content)$/i.test(low)) return false;

  if (specificityScore(t) < 4) return false;

  return true;
}

function expandPatternsForBase(base: string): string[] {
  const b = base.replace(/\s+/g, " ").trim();
  if (!b) return [];
  const lower = b.toLowerCase();
  /** Keep 4–8 words even when base is 2–3 tokens. */
  return [
    `how to ${lower} without sounding generic`,
    `how to ${lower} for better seo`,
    `best ${lower} software for small teams`,
    `best ${lower} tools compared for teams`,
    `${lower} vs hiring a freelance writer`,
    `alternatives to ${lower} docs and sheets`,
    `${lower} examples that convert readers`,
    `${lower} templates for weekly publishing`,
    `how to ${lower} step by step`,
    `best ${lower} for landing page copy`
  ];
}

function suggestSeedsForBase(base: string): string[] {
  const b = base.replace(/\s+/g, " ").trim().toLowerCase();
  if (!b) return [];
  return [`how to ${b}`, `best ${b}`, `best ${b} vs`, `${b} examples`];
}

export function dedupeSearchKeywordNearDuplicates(
  rows: SearchKeywordEngineRow[],
  jaccardThreshold = 0.91
): SearchKeywordEngineRow[] {
  const kept: SearchKeywordEngineRow[] = [];
  for (const r of rows) {
    const dup = kept.some((k) => enContentTokenJaccard(k.keyword, r.keyword) >= jaccardThreshold);
    if (!dup) kept.push(r);
  }
  return kept;
}

export type RunSearchKeywordEngineOptions = {
  baseTerms?: string[];
  /** Max keywords per base term before global dedupe. Default 40. */
  maxPerBase?: number;
  fetchSuggests?: boolean;
  jaccardDedupe?: number;
  signal?: AbortSignal;
};

/**
 * Collect + filter + dedupe search-intent keywords from pattern expansion and optional Google suggests.
 */
export async function runSearchKeywordEngine(
  options?: RunSearchKeywordEngineOptions
): Promise<SearchKeywordEngineRow[]> {
  const bases = options?.baseTerms?.length ? options.baseTerms : [...DEFAULT_SEARCH_BASE_TERMS];
  const maxPerBase = Math.max(8, options?.maxPerBase ?? 40);
  const fetchSuggests = options?.fetchSuggests !== false;
  const dedupeThresh = options?.jaccardDedupe ?? 0.91;

  const out: SearchKeywordEngineRow[] = [];
  const seenExact = new Set<string>();

  const push = (keyword: string, topicGroup: string) => {
    const k = keyword.replace(/\s+/g, " ").trim();
    const key = k.toLowerCase();
    if (seenExact.has(key)) return;
    if (!passesSearchKeywordEngineFilter(k)) return;
    seenExact.add(key);
    const internal = inferSearchDemandIntent(k);
    out.push({
      keyword: k,
      intent: mapToPublicIntent(internal),
      topic: topicGroup
    });
  };

  for (const base of bases) {
    const group = base.replace(/\s+/g, " ").trim();
    if (!group) continue;
    let added = 0;
    for (const line of expandPatternsForBase(group)) {
      if (added >= maxPerBase) break;
      const before = seenExact.size;
      push(line, group);
      if (seenExact.size > before) added++;
    }
    if (fetchSuggests) {
      for (const seed of suggestSeedsForBase(group)) {
        if (added >= maxPerBase) break;
        const sug = await fetchGoogleSuggestQueries(seed, { signal: options?.signal });
        for (const s of sug) {
          if (added >= maxPerBase) break;
          const before = seenExact.size;
          push(s, group);
          if (seenExact.size > before) added++;
        }
      }
    }
  }

  return dedupeSearchKeywordNearDuplicates(out, dedupeThresh);
}

/** Feed into EN topic pipeline as {@link GeneratedTopic}-shaped rows. */
export function searchKeywordEngineRowsToTopicEngineInput(rows: SearchKeywordEngineRow[]): TopicEngineKeywordRow[] {
  return rows.map((r, i) => ({
    topic: r.keyword,
    keyword: r.keyword,
    intent: r.intent,
    angle: `search_keyword_engine:${slugTopic(r.topic)}:${r.intent}:${i}`
  }));
}

function slugTopic(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 48);
}
