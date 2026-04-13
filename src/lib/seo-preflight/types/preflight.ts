/** Single engine: parameterized by market / locale / content language — no per-country code forks. */

export type SeoPreflightContentType = "guide" | "how_to" | "comparison" | "listicle";

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
