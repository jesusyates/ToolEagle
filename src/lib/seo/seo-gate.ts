/**
 * Server-side SEO / readability gate for admin-published guides (seo_articles).
 */

export type SeoArticleGateInput = {
  title: string;
  description: string;
  content: string;
};

export type SeoArticleGateResult = {
  ok: boolean;
  reasons: string[];
};

export type SeoResolveWithAutoFixResult =
  | {
      ok: true;
      content: string;
      description: string;
      autoFixed: boolean;
    }
  | {
      ok: false;
      reasons: string[];
      autoFixed: boolean;
    };

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** If description is empty, derive a short excerpt from content (same idea as guides metadata). */
function effectiveDescription(description: string, content: string): string {
  const d = description.trim();
  if (d.length > 0) return d;
  const t = content.replace(/\s+/g, " ").trim();
  return t.slice(0, 160);
}

/** Stored meta description: explicit trim or first 160 chars of normalized content. */
export function buildStoredDescription(description: string, content: string): string {
  const d = description.trim();
  if (d.length > 0) return d;
  const t = content.replace(/\s+/g, " ").trim();
  return t.slice(0, 160);
}

const BEAT_MARKERS: { label: string; test: (lower: string) => boolean }[] = [
  { label: "I thought", test: (l) => l.includes("i thought") },
  { label: "what happened", test: (l) => l.includes("what happened") },
  { label: "I realized", test: (l) => l.includes("i realized") },
  { label: "I started", test: (l) => l.includes("i started") },
  {
    label: "I'm still",
    test: (l) => l.includes("i'm still") || l.includes("i\u2019m still")
  }
];

function beatHitCount(lower: string): number {
  return BEAT_MARKERS.filter((b) => b.test(lower)).length;
}

/**
 * Applies content-only auto-fixes: first-person line, then minimal 5-beat block if needed.
 * Does not expand short articles (word count).
 */
export function attemptAutoFix(content: string): string {
  let out = content;
  const lower = out.toLowerCase();
  const hasI = /\bi\b/.test(lower);
  const hasMy = /\bmy\b/.test(lower);
  if (!hasI && !hasMy) {
    out = `I tried this because I was struggling with the same issue.\n\n${out}`;
  }

  const lower2 = out.toLowerCase();
  if (beatHitCount(lower2) < 3) {
    out += `\n\nI thought...\n\nWhat happened was...\n\nThen I realized...\n\nI started...\n\nI'm still...`;
  }

  return out;
}

/**
 * Validates title, description, and body before insert into seo_articles.
 */
export function validateSeoArticle(input: SeoArticleGateInput): SeoArticleGateResult {
  const reasons: string[] = [];
  const content = input.content ?? "";
  const title = (input.title ?? "").trim();

  if (!title) {
    reasons.push("title: required");
  }

  const desc = effectiveDescription(input.description ?? "", content);
  if (!desc.trim()) {
    reasons.push("description: must be provided or derivable from content");
  }

  const wc = wordCount(content);
  if (wc < 650) {
    reasons.push(`content: need at least 650 words (got ${wc})`);
  }

  const lower = content.toLowerCase();
  const hasI = /\bi\b/.test(lower);
  const hasMy = /\bmy\b/.test(lower);
  if (!hasI && !hasMy) {
    reasons.push('content: must include first-person markers ("I" or "my")');
  }

  const beatHits = beatHitCount(lower);
  if (beatHits < 3) {
    reasons.push(
      `structure: need at least 3 of 5 beats (I thought / what happened / I realized / I started / I'm still); found ${beatHits}`
    );
  }

  let listicleLines = 0;
  for (const line of content.split(/\r?\n/)) {
    const t = line.trim();
    if (/^\d+\.\s/.test(t) || /^-\s/.test(t)) {
      listicleLines++;
    }
  }
  if (listicleLines >= 3) {
    reasons.push('format: 3+ lines look like a listicle (start with "1." or "- ")');
  }

  if (lower.includes("in conclusion") || lower.includes("to sum up")) {
    reasons.push('tone: avoid generic closers ("in conclusion", "to sum up")');
  }

  return {
    ok: reasons.length === 0,
    reasons
  };
}

/**
 * validate → on fail, attemptAutoFix + optional description from first 160 chars → validate again.
 */
export function resolveSeoArticleWithAutoFix(input: SeoArticleGateInput): SeoResolveWithAutoFixResult {
  const title = (input.title ?? "").trim();
  let content = input.content ?? "";
  let description = input.description ?? "";

  const first = validateSeoArticle({ title, description, content });
  if (first.ok) {
    return {
      ok: true,
      content,
      description: buildStoredDescription(description, content),
      autoFixed: false
    };
  }

  content = attemptAutoFix(content);

  if (!description.trim()) {
    description = buildStoredDescription("", content);
  }

  const second = validateSeoArticle({ title, description, content });
  if (!second.ok) {
    return {
      ok: false,
      reasons: second.reasons,
      autoFixed: false
    };
  }

  const descOut = buildStoredDescription(description, content);

  return {
    ok: true,
    content,
    description: descOut,
    autoFixed: true
  };
}
