/** Single engine: parameterized by market / locale / content language — no per-country code forks. */

export type SeoPreflightContentType =
  | "guide"
  | "how_to"
  | "comparison"
  | "listicle"
  | "problem_solution"
  | "mistakes"
  | "comparison_from_experience"
  | "myth_busting"
  | "pattern_breakdown"
  | "scenario_specific";

/** All valid values for API / admin validation. */
export const SEO_PREFLIGHT_CONTENT_TYPES: SeoPreflightContentType[] = [
  "guide",
  "how_to",
  "comparison",
  "listicle",
  "problem_solution",
  "mistakes",
  "comparison_from_experience",
  "myth_busting",
  "pattern_breakdown",
  "scenario_specific"
];

export type SeoPreflightConfig = {
  targetCount: number;
  market: string;
  locale: string;
  contentLanguage: string;
  contentType: SeoPreflightContentType;
  site?: string;
  draftMode?: boolean;
  maxEstimatedCost?: number;
};

export type SeoPreflightCandidateResult = {
  topic: string;
  approved: boolean;
  rejectReason: string | null;
  title: string;
  slug: string;
  description: string;
  outlineHeadings: string[];
  estimatedCost: number;
  market: string;
  locale: string;
  contentLanguage: string;
  /** Intent used for title/outline/meta (per-row when scenario pipeline supplies types). */
  contentType?: SeoPreflightContentType;
  /** When set, draft generation updates this row instead of inserting (single recycle retry). */
  existingArticleId?: string;
};

export type SeoPreflightJobResult = {
  targetCount: number;
  candidatesSeen: number;
  approvedCount: number;
  rejectedCount: number;
  rejectReasonCounts: Record<string, number>;
  estimatedTotalCost: number;
  approved: SeoPreflightCandidateResult[];
  rejected: SeoPreflightCandidateResult[];
  ranAt: string;
};

export type PublishedCorpus = {
  urls: string[];
  titleHints: string[];
  topicKeys: string[];
};
