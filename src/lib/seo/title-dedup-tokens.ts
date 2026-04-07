/**
 * EN title dedup: strip high-frequency “shell” words so Jaccard reflects substantive overlap.
 * Used by topic-gate, publish-gate, content-asset-index (aligned thresholds).
 */

/** Generic / template words — ignored for similarity (not platform names). */
export const EN_TITLE_DEDUP_STOPWORDS = new Set([
  "about",
  "after",
  "also",
  "and",
  "are",
  "before",
  "being",
  "best",
  "between",
  "both",
  "but",
  "can",
  "come",
  "could",
  "did",
  "doing",
  "each",
  "even",
  "every",
  "for",
  "from",
  "get",
  "give",
  "guide",
  "had",
  "has",
  "have",
  "having",
  "how",
  "ideas",
  "into",
  "its",
  "just",
  "like",
  "look",
  "looking",
  "make",
  "making",
  "may",
  "more",
  "most",
  "need",
  "new",
  "not",
  "one",
  "only",
  "our",
  "out",
  "over",
  "own",
  "same",
  "should",
  "some",
  "such",
  "take",
  "than",
  "that",
  "the",
  "their",
  "them",
  "then",
  "these",
  "they",
  "this",
  "tips",
  "upon",
  "very",
  "want",
  "was",
  "ways",
  "were",
  "what",
  "when",
  "where",
  "which",
  "while",
  "who",
  "why",
  "will",
  "with",
  "without",
  "work",
  "your",
  "you"
]);

export function normalizeEnTitleForDedup(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function enContentTokenSet(s: string): Set<string> {
  return new Set(
    normalizeEnTitleForDedup(s)
      .split(" ")
      .filter((w) => w.length > 2 && !EN_TITLE_DEDUP_STOPWORDS.has(w))
  );
}

function jaccardSets(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

/** Jaccard on content tokens (stopwords stripped). */
export function enContentTokenJaccard(a: string, b: string): number {
  return jaccardSets(enContentTokenSet(a), enContentTokenSet(b));
}
