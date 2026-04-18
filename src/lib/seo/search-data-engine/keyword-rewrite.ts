import type { SearchDemandIntent } from "./types";
import { inferSearchDemandIntent } from "./search-style-gate";

function stableHash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  return Math.abs(h);
}

function alreadySearchShaped(phrase: string): boolean {
  const s = phrase.replace(/\s+/g, " ").trim().toLowerCase();
  return (
    /^how to\b/.test(s) ||
    /^best\b/.test(s) ||
    /^what is\b/.test(s) ||
    /^what are\b/.test(s) ||
    /\bvs\b|\bversus\b/i.test(s) ||
    /\balternatives to\b/.test(s) ||
    /\bexamples?\b/.test(s) ||
    /\btemplates?\b/.test(s)
  );
}

/**
 * Turn topic-style seed phrases into search-query-shaped keywords; intent is inferred on the result.
 */
export function rewriteTopicKeywordToSearchIntent(raw: string): {
  original: string;
  rewritten: string;
  intent: SearchDemandIntent;
} {
  const original = raw.replace(/\s+/g, " ").trim();
  if (!original) {
    return { original, rewritten: "", intent: "discovery" };
  }

  let s = original;

  if (/^tips for\b/i.test(s)) {
    s = s.replace(/^tips for\s+/i, "how to ");
  }

  if (/^how creators use\b/i.test(s)) {
    s = s.replace(/^how creators use\s+/i, "how to use ");
  }

  if (/\s+explained\s*$/i.test(s)) {
    s = s.replace(/\s+explained\s*$/i, "").trim();
    if (s.length > 0) {
      s = `what is ${s}`;
    }
  }

  s = s.replace(/\s+/g, " ").trim();
  if (!s) {
    return { original, rewritten: "", intent: "discovery" };
  }

  if (!alreadySearchShaped(s)) {
    const pick = stableHash(s) % 4;
    if (pick === 0) {
      s = `best ${s}`;
    } else if (pick === 1) {
      s = `how to ${s}`;
    } else if (pick === 2) {
      s = `${s} examples`;
    } else {
      s = `${s} vs alternatives`;
    }
  }

  s = s.replace(/\s+/g, " ").trim();
  return {
    original,
    rewritten: s,
    intent: inferSearchDemandIntent(s)
  };
}

/** Batch rewrite with stable per-string generic shaping. */
export function rewriteTopicKeywordsToSearchIntent(raws: string[]): ReturnType<typeof rewriteTopicKeywordToSearchIntent>[] {
  return raws.map((r) => rewriteTopicKeywordToSearchIntent(r));
}
