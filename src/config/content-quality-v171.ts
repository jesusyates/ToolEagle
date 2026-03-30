/**
 * V171 / V171.2 — Content quality convergence: thresholds (code is source of truth).
 * V171.2: thin pages → hard suppression only (noindex + sitemap + internal links), no soft pool.
 */

/** Minimum non-empty examples on an /ideas/{platform}/{topic} page for “strong” indexing. */
export const V171_MIN_TOPIC_EXAMPLES = 2;

/** Minimum characters per example line (avg) for topic example blocks. */
export const V171_MIN_TOPIC_EXAMPLE_AVG_CHARS = 28;

/** Below this avg char length on topic examples → hard thin suppression. */
export const V171_HARD_THIN_TOPIC_EXAMPLE_AVG_CHARS = 14;

/** Minimum total word count across shortAnswer + tldr + tips + examples for /answers. */
export const V171_MIN_ANSWER_BODY_WORDS = 95;

/** Below this word count, answer pages are treated as “thin” for hard suppression. */
export const V171_THIN_ANSWER_MAX_WORDS = 55;

/** At least this many tips for a non-thin answer. */
export const V171_MIN_ANSWER_TIPS = 3;

/** At least this many example strings on an answer page. */
export const V171_MIN_ANSWER_EXAMPLES = 2;

/** Programmatic list pages (/captions/*, /hooks/*, expansion, etc.): min example strings. */
export const V171_MIN_PROGRAMMATIC_EXAMPLES = 2;

/** Minimum total characters of joined example + visible body text for programmatic surfaces. */
export const V171_MIN_PROGRAMMATIC_BODY_CHARS = 120;

/** /ideas/[topic] hub pages — intro + title floor (no example block). */
export const V171_MIN_IDEAS_HUB_BODY_CHARS = 80;

/** UI / copy signals (hard thin if matched in rendered or source text). */
export const V171_NO_EXAMPLES_YET = /no examples yet/i;

export const V171_ACTIONABLE_MARKERS =
  /\b(step|steps|checklist|framework|template|formula|method|workflow|try this|use this|first,|second,|then |avoid |do this|start with|keep |hook|add a|put your|use line|characters|hashtag|caption)\b/i;

export const V171_PLACEHOLDER_MARKERS =
  /\blorem ipsum\b|\bTODO\b|\bTBD\b|coming soon|placeholder page/i;

/** If tips use numbered lists, flag duplicate leading numbers (format debt). */
export const V171_NUMBERED_TIP = /^\s*\d+\./;
