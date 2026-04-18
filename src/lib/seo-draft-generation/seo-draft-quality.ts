import {
  matchesValidEnglishTitleSkeleton,
  rebuildEnglishTitleToSkeleton,
  shouldEnforceEnglishTitleSkeleton
} from "@/lib/seo/seo-title-skeleton";

export type SeoDraftReviewStatus = "publish_ready" | "needs_revision" | "rejected";

export type DraftRecycleClass = "needs_rewrite" | "needs_split" | "rejected_archive";

export type SeoDraftQualityResult = {
  ok: boolean;
  reasons: string[];
};

export type SeoDraftForQuality = {
  title?: string;
  description?: string | null;
  content?: string;
};

export type FinalizedSeoDraft = SeoDraftForQuality & {
  review_status: SeoDraftReviewStatus;
  quality_reasons: string[];
  /** Set when `review_status` is not `publish_ready` (min recycle bucket for QA failures). */
  recycle_class?: DraftRecycleClass;
};

export function classifyDraftForRecycle(article: {
  title?: string;
  quality_reasons?: string[];
}): DraftRecycleClass {
  const reasons: string[] = article?.quality_reasons || [];
  const title = (article?.title || "").toLowerCase();

  if (
    reasons.includes("invalid_title_skeleton") ||
    reasons.includes("dirty_title_pattern") ||
    reasons.includes("dirty_title_phrase_dup") ||
    reasons.includes("description_too_short") ||
    reasons.includes("generic_filler")
  ) {
    return "needs_rewrite";
  }

  if (
    title.includes(" and ") ||
    title.includes(" vs ") ||
    title.includes("examples") ||
    title.includes("compared")
  ) {
    return "needs_split";
  }

  return "rejected_archive";
}

const DIRTY_TITLE_PATTERNS = [
  /tips, mistakes, and best/i,
  /^stop\s*:?/i,
  /^the ai/i,
  /^how creators use/i,
  /explained:/i
];

function titleHasDirtyPattern(title: string): boolean {
  return DIRTY_TITLE_PATTERNS.some((re) => re.test(title));
}

function titleHasDirtyPhraseDup(title: string): boolean {
  const t = title;
  if (/best best/i.test(t)) return true;
  if (/compared compared/i.test(t)) return true;
  if (/examples examples/i.test(t)) return true;
  if (/how to best/i.test(t)) return true;
  if (/^how to .+ compared$/i.test(t) && /\bbest\b/i.test(t)) return true;
  return false;
}

export function cleanupFinalSeoTitle(title: string): string {
  let t = (title || "").trim();

  t = t.replace(/^The\s+/i, "");
  t = t.replace(/^Stop\s*:?\s*/i, "");
  t = t.replace(/^How Creators Use\s+/i, "");
  t = t.replace(/^How to Best\s+/i, "How to ");
  t = t.replace(/\bExplained:?\b/gi, "");
  t = t.replace(/\bTips, Mistakes, and Best\b/gi, "");
  t = t.replace(/\bThat Scales\b/gi, "");
  t = t.replace(/\bWhat Actually Works in 2026\b/gi, "in 2026");
  t = t.replace(/\s+/g, " ").trim();

  t = t.replace(/^How to Best\s+/i, "How to ");
  t = t.replace(/^Best How to\s+/i, "How to ");

  t = t.replace(/\bcompared side by side\b/gi, "compared");

  t = t.replace(/\s+/g, " ").trim();

  if (!t) return t;
  t = t.charAt(0).toUpperCase() + t.slice(1);

  return t;
}

export function checkSeoDraftQuality(article: SeoDraftForQuality | null | undefined): SeoDraftQualityResult {
  const reasons: string[] = [];

  const title = (article?.title || "").trim();
  const description = (article?.description || "").trim();
  const content = (article?.content || "").trim();

  const lowerTitle = title.toLowerCase();
  const lowerContent = content.toLowerCase();

  const hasSeoIntent =
    lowerTitle.startsWith("how to") ||
    lowerTitle.startsWith("best") ||
    lowerTitle.includes(" vs ") ||
    lowerTitle.includes("example") ||
    lowerTitle.includes("compared");

  if (!hasSeoIntent) reasons.push("title_not_seo_intent");

  if (
    lowerTitle.includes("messy") ||
    lowerTitle.includes("sustainable") ||
    lowerTitle.includes("real talk") ||
    lowerTitle.includes("roadmap") ||
    lowerTitle.includes("goals") ||
    lowerTitle.includes("systems") ||
    lowerTitle.includes("plan") ||
    lowerTitle.includes("guessing")
  ) {
    reasons.push("title_has_bad_pattern");
  }

  if (content.length < 1200) reasons.push("content_too_short");

  if (!content.includes("##")) reasons.push("missing_h2_structure");

  if (!description || description.length < 80) reasons.push("description_too_short");

  if (
    lowerContent.includes("in today's fast-paced world") ||
    lowerContent.includes("whether you're a beginner") ||
    lowerContent.includes("game changer") ||
    lowerContent.includes("unlock the power")
  ) {
    reasons.push("generic_filler");
  }

  const placeholderHints = [
    "add practical steps here",
    "add realistic mistakes and fixes here",
    "summarize the main decision or action",
    "add more concrete steps, examples, and decision points"
  ];
  if (placeholderHints.some((h) => lowerContent.includes(h))) {
    reasons.push("repair_placeholder_content");
  }

  if (titleHasDirtyPattern(title)) {
    reasons.push("dirty_title_pattern");
  }

  if (titleHasDirtyPhraseDup(title)) {
    reasons.push("dirty_title_phrase_dup");
  }

  if (shouldEnforceEnglishTitleSkeleton(title) && !matchesValidEnglishTitleSkeleton(title)) {
    reasons.push("invalid_title_skeleton");
  }

  return {
    ok: reasons.length === 0,
    reasons
  };
}

export function autoRepairSeoDraft(
  article: SeoDraftForQuality | null | undefined,
  reasons: string[]
): SeoDraftForQuality {
  if (!article) return {};

  let title = (article.title || "").trim();
  let description = (article.description || "").trim();
  let content = (article.content || "").trim();

  if (
    shouldEnforceEnglishTitleSkeleton(title) &&
    (reasons.includes("dirty_title_phrase_dup") || reasons.includes("invalid_title_skeleton"))
  ) {
    title = rebuildEnglishTitleToSkeleton(title);
  }

  if (reasons.includes("title_has_bad_pattern")) {
    title = title
      .replace(/real talk on\s+/i, "")
      .replace(/from messy to manageable\s+/i, "")
      .replace(/build a sustainable\s+/i, "")
      .replace(/a clear\s+/i, "")
      .replace(/\broadmap\b/gi, "")
      .replace(/\bgoals\b/gi, "")
      .replace(/\bsystems?\b/gi, "")
      .replace(/\bplan\b/gi, "")
      .replace(/\bguessing\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  if (reasons.includes("title_not_seo_intent")) {
    const lower = title.toLowerCase();
    if (lower.includes("compare") || lower.includes("versus")) {
      title = title.replace(/compare/gi, "compared").replace(/versus/gi, "vs");
    } else if (lower.includes("tool") || lower.includes("tools")) {
      title = `Best ${title}`.replace(/\s+/g, " ").trim();
    } else if (lower.includes("example") || lower.includes("before and after")) {
      if (!lower.includes("example")) title = `${title} examples`.replace(/\s+/g, " ").trim();
    } else {
      title = `How to ${title}`.replace(/\s+/g, " ").trim();
    }
  }

  if (reasons.includes("description_too_short")) {
    description = `Learn ${title.toLowerCase()} with practical steps, clear examples, and actionable guidance for real-world use.`;
  }

  if (reasons.includes("generic_filler")) {
    content = content
      .replace(/In today's fast-paced world[^.]*./gi, "")
      .replace(/Whether you're a beginner[^.]*./gi, "")
      .replace(/This is a game changer[^.]*./gi, "")
      .replace(/Unlock the power[^.]*./gi, "")
      .trim();
  }

  if (reasons.includes("repair_placeholder_content")) {
    const stripPhrases = [
      "add practical steps here",
      "add realistic mistakes and fixes here",
      "summarize the main decision or action",
      "add more concrete steps, examples, and decision points"
    ];
    content = content
      .split("\n")
      .filter((line) => {
        const low = line.toLowerCase();
        return !stripPhrases.some((p) => low.includes(p));
      })
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  if (reasons.includes("missing_h2_structure")) {
    content = `## Overview\n\n${content.trim()}`;
  }

  if (reasons.includes("dirty_title_pattern") && !reasons.includes("dirty_title_phrase_dup")) {
    title = cleanupFinalSeoTitle(title);
  }

  return {
    ...article,
    title: title.replace(/\s+/g, " ").trim(),
    description: description.replace(/\s+/g, " ").trim(),
    content: content.replace(/\n{3,}/g, "\n\n").trim()
  };
}

/** Max repair attempts: each round is check → (if fail) autoRepair → next round. Never upgrades rejected to publish_ready. */
const MAX_REPAIR_ROUNDS = 2;

function withFinalTitleCleanup(d: SeoDraftForQuality): SeoDraftForQuality {
  const title = cleanupFinalSeoTitle((d.title || "").trim());
  return { ...d, title };
}

export function finalizeSeoDraft(article: SeoDraftForQuality | null | undefined): FinalizedSeoDraft {
  let draft: SeoDraftForQuality = { ...(article ?? {}) };

  for (let i = 0; i < MAX_REPAIR_ROUNDS; i++) {
    const result = checkSeoDraftQuality(draft);
    if (result.ok) {
      return {
        ...withFinalTitleCleanup(draft),
        review_status: "publish_ready",
        quality_reasons: []
      };
    }

    draft = autoRepairSeoDraft(draft, result.reasons);
  }

  const finalResult = checkSeoDraftQuality(draft);

  if (finalResult.ok) {
    return {
      ...withFinalTitleCleanup(draft),
      review_status: "publish_ready",
      quality_reasons: []
    };
  }

  const cleaned = withFinalTitleCleanup(draft);
  return {
    ...cleaned,
    review_status: "rejected",
    quality_reasons: finalResult.reasons,
    recycle_class: classifyDraftForRecycle({
      title: cleaned.title,
      quality_reasons: finalResult.reasons
    })
  };
}

export { isPreValidatedTitle } from "@/lib/seo/title-prevalidation";
