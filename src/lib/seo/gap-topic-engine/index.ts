export type {
  GapAwareKeywordOutput,
  GapAwareTopicEngineResult,
  SeoArticleCorpusRow,
  TopicCoverageSummary,
  TopicSaturation
} from "./types";
export { fetchSeoArticlesCorpus, filterCorpusForHistoricalTopicExclusion } from "./load-corpus";
export { buildTopicCoverageModel, detectIntentsInTitle, assignArticleToPillar, sortPillarsForGapFill } from "./coverage";
export { dedupeKeywordsAgainstCorpus, type DedupeKeywordInput } from "./dedupe";
export { runGapAwareTopicEngine, type RunGapAwareTopicEngineOptions } from "./run";
