/**
 * V165 — Minimal retrieval-oriented rows for `workflow-assets-retrieval.json`.
 */

export type WorkflowRetrievalRow = {
  id: string;
  topic: string;
  normalized_topic: string;
  workflow: string;
  page_type: string;
  locale: string;
  content_summary: string;
  quality_score: number;
  created_at: string;
};

export type WorkflowRetrievalBuckets = {
  by_workflow: Record<string, string[]>;
  by_page_type: Record<string, string[]>;
  by_locale: Record<string, string[]>;
};

export type WorkflowRetrievalDocument = {
  version: "165";
  builtAt: string;
  source: "agent_high_quality_assets.json";
  source_asset_count: number;
  item_count: number;
  items: WorkflowRetrievalRow[];
  buckets: WorkflowRetrievalBuckets;
};
