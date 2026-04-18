import type { SearchDemandIntent } from "./types";

/**
 * Reject non-search-style / low-intent phrasing for demand-led keywords and topics.
 * Aligned with scenario-mapper bans; kept local to avoid circular imports.
 */
const BANNED: RegExp[] = [
  /\bhow creators\b/i,
  /\bcreators use\b/i,
  /\btips for\b/i,
  /\bfor creators\b/i,
  /\bgeneric creator\b/i,
  /\bAI assistants explained\b/i
];

const WEAK_AUDIENCE_TAIL = /\bfor (bloggers|marketers|small teams|solo founders|busy creators|content creators)\b/i;

export function inferSearchDemandIntent(phrase: string): SearchDemandIntent {
  const s = phrase.replace(/\s+/g, " ").trim().toLowerCase();
  if (/\bvs\b|\bversus\b/i.test(s)) return "comparison";
  if (/^what is\b|^what are\b/.test(s)) return "discovery";
  if (/\bwhy\b/.test(s) && /\bnot working\b/.test(s)) return "how_to";
  if (/^how to\b/.test(s)) return "how_to";
  if (/\balternatives to\b/i.test(s)) return "alternatives";
  if (/\bexamples?\b/.test(s)) return "examples";
  if (/\bprompts?\b/.test(s)) return "templates";
  if (/\btemplates?\b/.test(s)) return "templates";
  if (/^best\b|\btop \d+\b/i.test(s)) return "tools";
  return "discovery";
}

/** Minimum bar: reads like a user query, not an essay title. */
export function passesSearchDemandPhrase(phrase: string): boolean {
  const s = phrase.replace(/\s+/g, " ").trim();
  if (s.length < 20 || s.length > 120) return false;
  const words = s.split(/\s+/).filter(Boolean);
  if (words.length < 4) return false;
  if (BANNED.some((r) => r.test(s))) return false;
  if (WEAK_AUDIENCE_TAIL.test(s)) return false;
  return true;
}
