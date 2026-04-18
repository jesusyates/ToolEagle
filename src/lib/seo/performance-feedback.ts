export type SeoPublishedPerformanceInput = {
  title: string;
  slug?: string;
  review_status?: string;
  publish_priority_score?: number;
  clicks?: number;
  impressions?: number;
};

export type SeoFeedbackResult = {
  feedbackScore: number;
  reasons: string[];
};

export function getTitlePattern(title: string): string {
  const t = title.toLowerCase();
  if (t.startsWith("how to")) return "howto";
  if (t.startsWith("best")) return "best";
  if (t.includes(" vs ")) return "vs";
  if (t.includes("example")) return "examples";
  return "other";
}

export function scoreSeoPerformanceFeedback(
  items: SeoPublishedPerformanceInput[]
): Record<string, SeoFeedbackResult> {
  const patternBuckets: Record<string, SeoPublishedPerformanceInput[]> = {};

  for (const item of items) {
    const key = getTitlePattern(item.title || "");
    if (!patternBuckets[key]) patternBuckets[key] = [];
    patternBuckets[key].push(item);
  }

  const out: Record<string, SeoFeedbackResult> = {};

  for (const [key, bucket] of Object.entries(patternBuckets)) {
    let score = 0;
    const reasons: string[] = [];

    const count = bucket.length;

    if (count >= 5) {
      score += 5;
      reasons.push("enough_history");
    }

    const avgPriority =
      bucket.reduce((sum, x) => sum + (x.publish_priority_score || 0), 0) / count;

    if (avgPriority >= 60) {
      score += 10;
      reasons.push("historically_strong_priority");
    }

    if (key === "howto" || key === "best") {
      score += 10;
      reasons.push("historically_strong_pattern");
    }

    if (key === "other") {
      score -= 15;
      reasons.push("weak_pattern_history");
    }

    out[key] = {
      feedbackScore: score,
      reasons
    };
  }

  return out;
}
