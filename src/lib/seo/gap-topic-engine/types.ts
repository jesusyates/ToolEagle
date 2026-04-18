import type { SearchKeywordPublicIntent } from "@/lib/seo/search-keyword-engine/types";

export type SeoArticleCorpusRow = {
  slug: string;
  title: string;
  description: string | null;
  status: string;
};

export type TopicSaturation = "low" | "balanced" | "high";

export type TopicCoverageSummary = {
  /** Pillar label (e.g. AI writing). */
  topic: string;
  articleCount: number;
  slugs: string[];
  coveredIntents: SearchKeywordPublicIntent[];
  missingIntents: SearchKeywordPublicIntent[];
  saturation: TopicSaturation;
};

export type GapAwareKeywordOutput = {
  keyword: string;
  intent: SearchKeywordPublicIntent;
  topic: string;
  proposedSlug: string;
  gapReason: string;
};

export type GapAwareTopicEngineResult = {
  coverage: TopicCoverageSummary[];
  keywords: GapAwareKeywordOutput[];
  /** Ready for {@link runSeoPreflightJob} `candidateSeedRows`. */
  preflightCandidateRows: Array<{ topic: string; contentType: "guide" }>;
};
