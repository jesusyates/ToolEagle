import type { SeoPreflightCandidateResult } from "@/lib/seo-preflight/client";
import type { DraftRecycleClass, SeoDraftReviewStatus } from "./seo-draft-quality";

export type SeoDraftRowResult = {
  topic: string;
  title: string;
  slug: string;
  description: string;
  outline: string[];
  fullContent: string;
  qualityPass: boolean;
  qualityRejectReason: string | null;
  /** Automated QA outcome (not persisted to DB unless you add columns). */
  review_status: SeoDraftReviewStatus;
  quality_reasons: string[];
  /** Min recycle bucket when `review_status` is not `publish_ready` (see `classifyDraftForRecycle`). */
  recycle_class?: DraftRecycleClass;
  savedAsDraft: boolean;
  saveError: string | null;
  /** Set when `savedAsDraft` and insert returned id (for publish queue). */
  articleId: string | null;
};

export type SeoDraftGenerationJobResult = {
  ranAt: string;
  source: "request_body" | "preflight_file" | "automation_pipeline" | "gap_auto_pipeline";
  inputCount: number;
  rows: SeoDraftRowResult[];
};

export type SeoDraftGenerationInput = {
  approved: SeoPreflightCandidateResult[];
};
