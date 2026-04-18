import type { SearchDemandRow } from "./types";
import { fetchGoogleSuggestQueries } from "./google-suggest";
import { inferSearchDemandIntent, passesSearchDemandPhrase } from "./search-style-gate";

/** Turn cluster spindle text into a compact core for suggest seeds. */
export function clusterToSearchCore(cluster: string): string {
  const s = cluster.replace(/\s+/g, " ").trim();
  const head = s.split(/[,;]/)[0]!.trim();
  const lower = head.toLowerCase();
  return lower.length > 80 ? lower.slice(0, 80).replace(/\s+\S*$/, "").trim() : lower;
}

function templateRows(core: string): SearchDemandRow[] {
  const c = core.replace(/\s+/g, " ").trim();
  if (!c) return [];
  const templates = [
    `best ${c} tools`,
    `best ${c} software`,
    `how to ${c}`,
    `best ${c} compared`,
    `alternatives to ${c}`,
    `${c} examples`,
    `${c} templates`,
    `how to ${c} step by step`
  ];
  const out: SearchDemandRow[] = [];
  for (const keyword of templates) {
    const topic = keyword.replace(/\s+/g, " ").trim();
    if (!passesSearchDemandPhrase(topic)) continue;
    out.push({
      keyword: topic,
      intent: inferSearchDemandIntent(topic),
      topic,
      source: "template"
    });
  }
  return out;
}

function suggestSeeds(core: string): string[] {
  const c = core.replace(/\s+/g, " ").trim();
  if (!c) return [];
  return [`how to ${c}`, `best ${c}`, `best ${c} vs`, `alternatives to ${c}`, `${c} examples`];
}

/**
 * Collect real search-shaped keywords for one cluster (suggests first, then templates).
 */
export async function collectSearchDemandForCluster(
  cluster: string,
  options?: {
    max?: number;
    /** When false, skip network (templates only). Default true. */
    fetchSuggests?: boolean;
    signal?: AbortSignal;
  }
): Promise<SearchDemandRow[]> {
  const max = Math.max(6, options?.max ?? 24);
  const fetchSuggests = options?.fetchSuggests !== false;
  const core = clusterToSearchCore(cluster);

  const seen = new Set<string>();
  const rows: SearchDemandRow[] = [];

  const pushRow = (keyword: string, source: SearchDemandRow["source"]) => {
    const topic = keyword.replace(/\s+/g, " ").trim();
    const key = topic.toLowerCase();
    if (seen.has(key)) return;
    if (!passesSearchDemandPhrase(topic)) return;
    seen.add(key);
    rows.push({
      keyword: topic,
      intent: inferSearchDemandIntent(topic),
      topic,
      source
    });
  };

  if (fetchSuggests && core) {
    const seeds = suggestSeeds(core);
    for (const seed of seeds) {
      if (rows.length >= max) break;
      const sug = await fetchGoogleSuggestQueries(seed, { signal: options?.signal });
      for (const s of sug) {
        if (rows.length >= max) break;
        pushRow(s, "google_suggest");
      }
    }
  }

  for (const t of templateRows(core)) {
    if (rows.length >= max) break;
    pushRow(t.keyword, "template");
  }

  return rows.slice(0, max);
}
