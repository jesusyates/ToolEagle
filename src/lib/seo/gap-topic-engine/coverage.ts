import { DEFAULT_SEARCH_BASE_TERMS } from "@/lib/seo/search-keyword-engine";
import type { SearchKeywordPublicIntent } from "@/lib/seo/search-keyword-engine/types";
import type { SeoArticleCorpusRow, TopicCoverageSummary, TopicSaturation } from "./types";

const INTENT_ALL: SearchKeywordPublicIntent[] = ["how_to", "list", "comparison", "examples"];

function median(nums: number[]): number {
  const a = [...nums].sort((x, y) => x - y);
  if (a.length === 0) return 0;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m]! : ((a[m - 1]! + a[m]!) / 2);
}

/** Infer which public intents are already represented by a title (coarse, for gap filling). */
export function detectIntentsInTitle(title: string): Set<SearchKeywordPublicIntent> {
  const s = title.toLowerCase();
  const out = new Set<SearchKeywordPublicIntent>();
  if (/\bwhy\b/.test(s) && /\bnot working\b/.test(s)) out.add("how_to");
  if (/\bhow to fix\b/.test(s) || /^how to\b/.test(s) || /\bhow to\b/.test(s)) out.add("how_to");
  if (/^best\b|\btop \d+\b|\branked\b|\bsoftware\b|\btools\b|\btemplates?\b|\bprompts?\b/.test(s)) {
    out.add("list");
  }
  if (/\bvs\b|\bversus\b|\balternatives\b/.test(s)) out.add("comparison");
  if (/\bexamples?\b/.test(s)) out.add("examples");
  return out;
}

function pillarScore(blob: string, pillar: string): number {
  const words = pillar
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9]/g, ""))
    .filter((w) => w.length > 2);
  let score = 0;
  for (const w of words) {
    if (blob.includes(w)) score += w.length;
  }
  return score;
}

export function assignArticleToPillar(
  article: SeoArticleCorpusRow,
  pillars: string[],
  countByPillar: Map<string, number>
): string {
  const blob = `${article.title} ${article.slug} ${article.description ?? ""}`.toLowerCase();
  let bestP = pillars[0]!;
  let bestS = -1;
  for (const p of pillars) {
    const sc = pillarScore(blob, p);
    if (sc > bestS) {
      bestS = sc;
      bestP = p;
    }
  }
  if (bestS >= 4) return bestP;
  let minP = pillars[0]!;
  let minC = Number.POSITIVE_INFINITY;
  for (const p of pillars) {
    const c = countByPillar.get(p) ?? 0;
    if (c < minC) {
      minC = c;
      minP = p;
    }
  }
  return minP;
}

export function buildTopicCoverageModel(
  articles: SeoArticleCorpusRow[],
  pillars?: string[]
): TopicCoverageSummary[] {
  const pl = pillars?.length ? pillars : [...DEFAULT_SEARCH_BASE_TERMS];
  const countByPillar = new Map<string, number>();
  const slugsByPillar = new Map<string, string[]>();
  const intentsByPillar = new Map<string, Set<SearchKeywordPublicIntent>>();

  for (const p of pl) {
    countByPillar.set(p, 0);
    slugsByPillar.set(p, []);
    intentsByPillar.set(p, new Set());
  }

  for (const a of articles) {
    const pillar = assignArticleToPillar(a, pl, countByPillar);
    countByPillar.set(pillar, (countByPillar.get(pillar) ?? 0) + 1);
    slugsByPillar.get(pillar)!.push(a.slug);
    const ti = detectIntentsInTitle(a.title);
    const agg = intentsByPillar.get(pillar)!;
    for (const x of ti) {
      agg.add(x);
    }
  }

  const counts = pl.map((p) => countByPillar.get(p) ?? 0);
  const med = median(counts.filter((c) => c > 0));
  const highBar = med > 0 ? Math.max(12, Math.ceil(med * 2.5)) : 12;

  return pl.map((topic) => {
    const articleCount = countByPillar.get(topic) ?? 0;
    const covered = intentsByPillar.get(topic) ?? new Set();
    const coveredArr = INTENT_ALL.filter((i) => covered.has(i));
    const missingArr = INTENT_ALL.filter((i) => !covered.has(i));

    let saturation: TopicSaturation = "balanced";
    if (articleCount === 0 || (med > 0 && articleCount < Math.max(1, Math.floor(med * 0.5)))) {
      saturation = "low";
    } else if (articleCount >= highBar) {
      saturation = "high";
    }

    return {
      topic,
      articleCount,
      slugs: slugsByPillar.get(topic) ?? [],
      coveredIntents: coveredArr,
      missingIntents: missingArr,
      saturation
    };
  });
}

export function sortPillarsForGapFill(summaries: TopicCoverageSummary[]): TopicCoverageSummary[] {
  return [...summaries].sort((a, b) => {
    if (a.saturation === "high" && b.saturation !== "high") return 1;
    if (b.saturation === "high" && a.saturation !== "high") return -1;
    const md = b.missingIntents.length - a.missingIntents.length;
    if (md !== 0) return md;
    return a.articleCount - b.articleCount;
  });
}
