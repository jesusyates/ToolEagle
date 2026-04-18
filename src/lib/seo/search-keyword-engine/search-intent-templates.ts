import { fetchGoogleSuggestQueries } from "../search-data-engine/google-suggest";
import { inferSearchDemandIntent } from "../search-data-engine/search-style-gate";
import type { SearchKeywordEngineRow } from "./types";
import { dedupeSearchKeywordNearDuplicates, mapToPublicIntent } from "./engine";

const VS_OTHERS = [
  "manual editing",
  "human writers only",
  "traditional workflows",
  "doing it yourself",
  "generic ai tools",
  "copy paste templates",
  "hiring a freelancer",
  "last years playbook"
];

/** When a bare template is under four words, append one of these (search-style). */
const SHORT_PADS = [
  "that work well",
  "for beginners",
  "step by step",
  "without extra tools",
  "for more engagement"
];

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * STRICT filter for template-generated keywords (search-style only).
 */
export function passesSearchIntentTemplateKeyword(keyword: string): boolean {
  const t = keyword.replace(/\s+/g, " ").trim();
  if (!t) return false;
  const low = t.toLowerCase();
  const wc = wordCount(t);
  if (wc < 4 || wc > 8) return false;
  if (t.length < 20 || t.length > 100) return false;

  if (/\btips for\b/i.test(t)) return false;
  if (/\bguide to\b/i.test(t)) return false;
  if (/\bhow creators\b/i.test(t)) return false;
  if (/\bcreators use\b/i.test(t)) return false;
  if (/\bexplained\b/i.test(t)) return false;

  if (
    !/\b(how to|best|vs|versus|examples?|templates?|prompts?|why\b)\b/i.test(t)
  ) {
    return false;
  }

  return true;
}

function padToMinWords(phrase: string): string {
  const s = phrase.replace(/\s+/g, " ").trim();
  if (wordCount(s) >= 4) return s;
  for (const p of SHORT_PADS) {
    const next = `${s} ${p}`.replace(/\s+/g, " ").trim();
    if (wordCount(next) >= 4 && wordCount(next) <= 8) return next;
  }
  return s;
}

function normalizeKeywordPhrase(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

function buildCoreTemplateCandidates(topicLower: string): string[] {
  const t = topicLower.replace(/\s+/g, " ").trim();
  if (!t) return [];

  const lines: string[] = [
    `how to ${t}`,
    `how to ${t} with ai`,
    `best ${t}`,
    `best ${t} tools`,
    `${t} examples`,
    `${t} templates`,
    `${t} prompts`,
    `why ${t} not working`,
    `how to fix ${t}`
  ];

  for (const other of VS_OTHERS) {
    lines.push(`${t} vs ${other}`);
  }

  /** Extra search-shaped variants to reach 20–50 rows without network. */
  lines.push(
    `how to ${t} for beginners`,
    `how to ${t} step by step`,
    `how to ${t} with chatgpt`,
    `how to ${t} for youtube`,
    `how to ${t} for faster output`,
    `best ${t} for beginners`,
    `best ${t} software tools`,
    `best ${t} for marketing teams`,
    `best ${t} for social media`,
    `${t} examples that work`,
    `${t} templates that convert`,
    `${t} prompts for marketing`,
    `${t} prompts that convert`,
    `best ${t} compared side by side`,
    `how to ${t} without sounding generic`,
    `how to ${t} for email marketing`,
    `${t} vs ai generated copy`,
    `best ${t} ranked for beginners`,
    `how to scale ${t} with ai`
  );

  return lines.map((x) => padToMinWords(x)).map(normalizeKeywordPhrase);
}

function suggestSeeds(topicLower: string): string[] {
  const t = topicLower.replace(/\s+/g, " ").trim();
  if (!t) return [];
  return [`how to ${t}`, `best ${t}`, `best ${t} tools`, `${t} examples`, `${t} vs`];
}

export type GenerateSearchIntentKeywordsOptions = {
  /** Target minimum rows after filter + dedupe. Default 20. */
  min?: number;
  /** Hard cap. Default 50. */
  max?: number;
  fetchSuggests?: boolean;
  jaccardDedupe?: number;
  signal?: AbortSignal;
};

/**
 * Sync template expansion (no Google suggests) — for planners like gap-topic-engine.
 */
export function listSearchIntentTemplateCandidates(topic: string): SearchKeywordEngineRow[] {
  const topicLabel = topic.replace(/\s+/g, " ").trim();
  if (!topicLabel) return [];
  const t = topicLabel.toLowerCase();
  const rows: SearchKeywordEngineRow[] = [];
  const seen = new Set<string>();
  for (const line of buildCoreTemplateCandidates(t)) {
    const k = normalizeKeywordPhrase(line);
    if (!k || seen.has(k)) continue;
    if (!passesSearchIntentTemplateKeyword(k)) continue;
    seen.add(k);
    rows.push({
      keyword: k,
      intent: mapToPublicIntent(inferSearchDemandIntent(k)),
      topic: topicLabel
    });
  }
  return dedupeSearchKeywordNearDuplicates(rows, 0.91);
}

/**
 * Generate 20–50 search-intent keywords for one topic using fixed templates (+ optional suggests).
 */
export async function generateSearchIntentKeywordsForTopic(
  topic: string,
  options?: GenerateSearchIntentKeywordsOptions
): Promise<SearchKeywordEngineRow[]> {
  const topicLabel = topic.replace(/\s+/g, " ").trim();
  const t = topicLabel.toLowerCase();
  const min = Math.max(1, options?.min ?? 20);
  const max = Math.min(80, Math.max(min, options?.max ?? 50));
  const fetchSuggests = options?.fetchSuggests !== false;
  const dedupeThresh = options?.jaccardDedupe ?? 0.91;

  const seen = new Set<string>();
  const rows: SearchKeywordEngineRow[] = [];

  const push = (keyword: string) => {
    const k = normalizeKeywordPhrase(keyword);
    if (!k || seen.has(k)) return;
    if (!passesSearchIntentTemplateKeyword(k)) return;
    seen.add(k);
    rows.push({
      keyword: k,
      intent: mapToPublicIntent(inferSearchDemandIntent(k)),
      topic: topicLabel
    });
  };

  for (const line of buildCoreTemplateCandidates(t)) {
    if (rows.length >= max) break;
    push(line);
  }

  if (fetchSuggests && rows.length < max) {
    for (const seed of suggestSeeds(t)) {
      if (rows.length >= max) break;
      const sug = await fetchGoogleSuggestQueries(seed, { signal: options?.signal });
      for (const s of sug) {
        if (rows.length >= max) break;
        push(s);
      }
    }
  }

  let deduped = dedupeSearchKeywordNearDuplicates(rows, dedupeThresh);

  if (deduped.length < min && fetchSuggests) {
    for (const seed of [`why ${t} not working`, `how to fix ${t}`, `${t} templates`, `${t} prompts`]) {
      if (deduped.length >= min) break;
      const sug = await fetchGoogleSuggestQueries(seed, { signal: options?.signal });
      for (const s of sug) {
        const k = normalizeKeywordPhrase(s);
        if (!k || seen.has(k)) continue;
        if (!passesSearchIntentTemplateKeyword(k)) continue;
        seen.add(k);
        rows.push({
          keyword: k,
          intent: mapToPublicIntent(inferSearchDemandIntent(k)),
          topic: topicLabel
        });
      }
      deduped = dedupeSearchKeywordNearDuplicates(rows, dedupeThresh);
    }
  }

  return deduped.slice(0, max);
}
