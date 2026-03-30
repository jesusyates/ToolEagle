import rules from "../../../generated/v191-analysis-rules.json";

const STOP = new Set((rules.stopwords as string[]).map((w) => w.toLowerCase()));

export function extractTopKeywords(blob: string, limit = 12): string[] {
  const words = blob
    .toLowerCase()
    .replace(/[^a-z0-9\s#]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP.has(w) && !/^\d+$/.test(w));
  const freq = new Map<string, number>();
  for (const w of words) {
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([w]) => w);
}

/** 0 = very focused niche language, 1 = scattered vocabulary */
export function nicheEntropyScore(topWords: string[], totalWordCount: number): number {
  if (totalWordCount < 8) return 0.5;
  const topSet = new Set(topWords);
  const concentration = topWords.length > 0 ? topWords.length / Math.max(20, totalWordCount) : 0.5;
  const diversity = Math.min(1, topSet.size / 15);
  return Math.min(1, 0.35 + diversity * 0.4 + (1 - concentration) * 0.25);
}

export function countWords(blob: string): number {
  return blob.split(/\s+/).filter(Boolean).length;
}
