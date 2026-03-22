/**
 * V100.3 — Feedback categories & workflow values
 */

export const FEEDBACK_CATEGORIES = [
  "bug",
  "feature_request",
  "output_quality",
  "payment_support",
  "general_feedback"
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export const FEEDBACK_STATUSES = ["new", "reviewed", "planned", "closed"] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export const FEEDBACK_PRIORITIES = ["low", "normal", "high"] as const;
