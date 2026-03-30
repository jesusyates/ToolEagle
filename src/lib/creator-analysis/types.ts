/**
 * V191 — Creator Analysis Engine MVP (manual input, no platform crawl).
 */

export type AnalysisPlatform = "tiktok" | "youtube" | "instagram";

export type AccountGoal = "views" | "followers" | "sales" | "mixed";

export type PastContentItem = {
  title?: string;
  caption?: string;
  description?: string;
  cta?: string;
};

export type CreatorAnalysisInput = {
  platform: AnalysisPlatform;
  accountGoal: AccountGoal;
  niche: string;
  pastContent: PastContentItem[];
  bio?: string;
  positioning?: string;
};

export type ContentMix = Record<
  "tutorial" | "storytelling" | "selling" | "opinion" | "listicle" | "other",
  number
>;

export type MonetizationReadinessLevel = "low" | "medium" | "high";

export type HookDistribution = Record<
  "question" | "fear" | "curiosity" | "list" | "story" | "command" | "none",
  number
>;

export type CtaUsageSnapshot = {
  posts_with_cta: number;
  posts_without_cta: number;
  coverage: number;
  dominant_cta_kind: "soft_engagement" | "link_or_shop" | "hard_sell" | "none" | "mixed";
};

export type ContentIssueSnapshot = {
  id: string;
  title: string;
  detail: string;
};

export type CreatorStageV191 = "beginner" | "growing" | "monetizing";
export type PrimaryFocusV191 = "growth" | "conversion";

export type CreatorAnalysisOutput = {
  creator_profile: string;
  content_mix: ContentMix;
  dominant_style: string;
  /** Opening-line / title hook mix (percentages) */
  hook_distribution: HookDistribution;
  /** Structured CTA coverage */
  cta_usage: CtaUsageSnapshot;
  /** 0–100, higher = tighter topical language */
  topic_consistency_score: number;
  /** Heuristic account stage */
  creator_stage: CreatorStageV191;
  /** Growth vs conversion lean */
  primary_focus: PrimaryFocusV191;
  /** 0–100: higher = more conversion / monetization-focused signals */
  account_focus_score: number;
  monetization_readiness: MonetizationReadinessLevel;
  top_strengths: string[];
  /** @deprecated use content_issues for structured UI; kept for prompts */
  top_weaknesses: string[];
  /** Three concrete issues */
  content_issues: ContentIssueSnapshot[];
  /** Suggested formats / angles */
  next_content_types: string[];
  /** One-line next move */
  next_best_action: string;
  /** 1–2 sentence strategy */
  short_strategy: string;
  next_content_recommendations: string[];
  next_best_strategy: string;
  /** For debugging / UI badges */
  _signals?: {
    cta_coverage: number;
    niche_entropy: number;
    avg_hook_len: number;
    selling_mix: number;
    tutorial_mix: number;
    story_mix: number;
  };
};
