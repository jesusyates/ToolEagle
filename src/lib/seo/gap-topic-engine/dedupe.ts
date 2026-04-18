import { slugifyForSeo } from "@/lib/seo-preflight/policy/slug";
import { enContentTokenJaccard } from "@/lib/seo/title-dedup-tokens";
import type { SearchKeywordPublicIntent } from "@/lib/seo/search-keyword-engine/types";
import type { SeoArticleCorpusRow } from "./types";

export type DedupeKeywordInput = {
  keyword: string;
  intent: SearchKeywordPublicIntent;
  topic: string;
  gapReason: string;
};

/**
 * Corpus + slug + token-Jaccard dedupe (embedding-free proxy for “semantic duplicate”).
 */
export function dedupeKeywordsAgainstCorpus(
  candidates: DedupeKeywordInput[],
  articles: SeoArticleCorpusRow[],
  options?: {
    jaccardThreshold?: number;
    slugOverlap?: boolean;
  }
): DedupeKeywordInput[] {
  const jTh = options?.jaccardThreshold ?? 0.92;
  const checkSlug = options?.slugOverlap !== false;

  const existingTitles = articles.map((a) => a.title.replace(/\s+/g, " ").trim()).filter(Boolean);
  const existingSlugs = new Set(articles.map((a) => a.slug.toLowerCase().replace(/\s+/g, " ").trim()));

  const kept: DedupeKeywordInput[] = [];
  const seenKw = new Set<string>();

  for (const c of candidates) {
    const k = c.keyword.toLowerCase().replace(/\s+/g, " ").trim();
    if (!k || seenKw.has(k)) continue;

    if (checkSlug) {
      const prop = slugifyForSeo(c.keyword, "en").toLowerCase();
      if (prop && existingSlugs.has(prop)) continue;
    }

    let nearTitle = false;
    for (const t of existingTitles) {
      if (enContentTokenJaccard(t, c.keyword) >= jTh) {
        nearTitle = true;
        break;
      }
    }
    if (nearTitle) continue;

    let nearKept = false;
    for (const x of kept) {
      if (enContentTokenJaccard(x.keyword, c.keyword) >= jTh) {
        nearKept = true;
        break;
      }
    }
    if (nearKept) continue;

    seenKw.add(k);
    kept.push(c);
  }

  return kept;
}
