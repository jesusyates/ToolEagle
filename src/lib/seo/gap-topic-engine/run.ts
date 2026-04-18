import { listSearchIntentTemplateCandidates } from "@/lib/seo/search-keyword-engine";
import type { SearchKeywordPublicIntent } from "@/lib/seo/search-keyword-engine/types";
import { slugifyForSeo } from "@/lib/seo-preflight/policy/slug";
import { isPreValidatedTitle } from "@/lib/seo/title-prevalidation";
import { enContentTokenJaccard } from "@/lib/seo/title-dedup-tokens";
import { buildTopicCoverageModel, sortPillarsForGapFill } from "./coverage";
import type { GapAwareKeywordOutput, GapAwareTopicEngineResult, SeoArticleCorpusRow } from "./types";

export type RunGapAwareTopicEngineOptions = {
  /** Target keyword count (e.g. 50). */
  wanted: number;
  articles: SeoArticleCorpusRow[];
  /** Pillar list; defaults to {@link DEFAULT_SEARCH_BASE_TERMS} via coverage. */
  pillars?: string[];
  jaccardThreshold?: number;
};

function sortCandidatesForPillar(
  rows: Array<{ keyword: string; intent: SearchKeywordPublicIntent; topic: string }>,
  missing: Set<SearchKeywordPublicIntent>
): typeof rows {
  return [...rows].sort((a, b) => {
    const am = missing.has(a.intent) ? 0 : 1;
    const bm = missing.has(b.intent) ? 0 : 1;
    if (am !== bm) return am - bm;
    return a.keyword.localeCompare(b.keyword);
  });
}

/**
 * Gap-aware planner: scan corpus → coverage → prioritize pillars → template keywords (round-robin) → dedupe → N outputs for preflight.
 *
 * **Note:** `seo_articles` has no `keyword` column; topics/intents are inferred from **title + slug** (+ description).
 */
export function runGapAwareTopicEngine(options: RunGapAwareTopicEngineOptions): GapAwareTopicEngineResult {
  const wanted = Math.max(1, Math.floor(options.wanted));
  const articles = options.articles;
  const jTh = options.jaccardThreshold ?? 0.92;

  const coverage = sortPillarsForGapFill(buildTopicCoverageModel(articles, options.pillars));

  const existingTitles = articles.map((a) => a.title.replace(/\s+/g, " ").trim()).filter(Boolean);
  const existingSlugs = new Set(
    articles.map((a) => a.slug.toLowerCase().replace(/\s+/g, " ").trim()).filter(Boolean)
  );

  const queues = coverage.map((row) => {
    const missing = new Set(row.missingIntents);
    const reasonBase =
      row.saturation === "high"
        ? "saturated_pillar_fill"
        : row.missingIntents.length > 0
          ? `missing_intents:${row.missingIntents.join(",")}`
          : "low_volume_pillar";
    const ordered = sortCandidatesForPillar(listSearchIntentTemplateCandidates(row.topic), missing);
    return {
      row,
      reasonBase,
      ordered,
      idx: 0
    };
  });

  const picked: GapAwareKeywordOutput[] = [];

  const tryAdd = (kw: GapAwareKeywordOutput): boolean => {
    const k = kw.keyword.toLowerCase().replace(/\s+/g, " ").trim();
    if (!k) return false;
    if (picked.some((p) => p.keyword.toLowerCase() === k)) return false;

    const prop = slugifyForSeo(kw.keyword, "en").toLowerCase();
    if (prop && existingSlugs.has(prop)) return false;

    for (const t of existingTitles) {
      if (enContentTokenJaccard(t, kw.keyword) >= jTh) return false;
    }
    for (const p of picked) {
      if (enContentTokenJaccard(p.keyword, kw.keyword) >= jTh) return false;
    }

    picked.push(kw);
    return true;
  };

  while (picked.length < wanted) {
    let progressed = false;
    for (const q of queues) {
      if (picked.length >= wanted) break;
      while (q.idx < q.ordered.length) {
        const t = q.ordered[q.idx]!;
        q.idx += 1;
        const out: GapAwareKeywordOutput = {
          keyword: t.keyword,
          intent: t.intent,
          topic: t.topic,
          proposedSlug: slugifyForSeo(t.keyword, "en"),
          gapReason: `${q.reasonBase};articles=${q.row.articleCount}`
        };
        if (tryAdd(out)) {
          progressed = true;
          break;
        }
      }
    }
    if (!progressed) break;
  }

  return {
    coverage,
    keywords: picked,
    preflightCandidateRows: picked
      .filter((k) => isPreValidatedTitle(k.keyword))
      .map((k) => ({ topic: k.keyword, contentType: "guide" as const }))
  };
}
