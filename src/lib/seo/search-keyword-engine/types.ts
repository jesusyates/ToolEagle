/** Public intent labels for SEO routing (narrower than internal SearchDemandIntent). */
export type SearchKeywordPublicIntent = "how_to" | "list" | "comparison" | "examples";

/** One row for clustering + topic engine. */
export type SearchKeywordEngineRow = {
  keyword: string;
  intent: SearchKeywordPublicIntent;
  /** Grouping key (usually the base term bucket, e.g. "AI writing"). */
  topic: string;
};

/** Compatible with {@link GeneratedTopic} from topic-engine (no runtime import). */
export type TopicEngineKeywordRow = {
  topic: string;
  keyword: string;
  angle: string;
  intent?: string;
};
