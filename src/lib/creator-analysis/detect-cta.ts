import rules from "../../../generated/v191-analysis-rules.json";

const PHRASES = (rules.cta_phrases as string[]).map((p) => p.toLowerCase());

export function detectCtaHits(text: string): number {
  const t = text.toLowerCase();
  let hits = 0;
  for (const p of PHRASES) {
    if (p.length >= 4 && t.includes(p)) hits += 1;
    else if (p.length < 4 && new RegExp(`\\b${escapeRe(p)}\\b`, "i").test(t)) hits += 1;
  }
  return hits;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function ctaCoverageAcrossItems(texts: string[]): number {
  if (texts.length === 0) return 0;
  const withCta = texts.filter((x) => detectCtaHits(x) > 0).length;
  return withCta / texts.length;
}
