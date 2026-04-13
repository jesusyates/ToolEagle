import type { SeoPreflightCandidateResult } from "../types/preflight";
import { endsWithCompleteSentence, META_DESCRIPTION_BOUNDS } from "./meta-description";

export type SeoStructureIssue = { code: string; message: string };

const TITLE_MIN = 16;
const TITLE_MAX = 88;
const DESC_MIN = META_DESCRIPTION_BOUNDS.min;
const DESC_MAX = META_DESCRIPTION_BOUNDS.max;
const MIN_H = 3;
const MAX_H = 12;

export function validateSeoStructure(partial: {
  title: string;
  slug: string;
  description: string;
  outlineHeadings: string[];
}): SeoStructureIssue | null {
  const t = partial.title.trim();
  if (t.length < TITLE_MIN || t.length > TITLE_MAX) {
    return { code: "title_length", message: `title length ${t.length} not in [${TITLE_MIN},${TITLE_MAX}]` };
  }
  if (!partial.slug || partial.slug.length < 3) {
    return { code: "slug_empty", message: "slug too short" };
  }
  const d = partial.description.trim();
  if (d.length < DESC_MIN || d.length > DESC_MAX) {
    return { code: "description_length", message: `description length ${d.length} not in [${DESC_MIN},${DESC_MAX}]` };
  }
  if (!endsWithCompleteSentence(d)) {
    return { code: "description_incomplete", message: "description must end with sentence-ending punctuation" };
  }
  if (/\b[a-z]{1,2}\s*$/i.test(d)) {
    return { code: "description_truncated_word", message: "description ends with a fragment that looks truncated" };
  }
  const h = partial.outlineHeadings.filter((x) => String(x).trim().length > 0);
  if (h.length < MIN_H || h.length > MAX_H) {
    return { code: "outline_headings", message: `headings count ${h.length} not in [${MIN_H},${MAX_H}]` };
  }
  return null;
}

export function candidateFromStructureReject(
  base: Omit<SeoPreflightCandidateResult, "approved" | "rejectReason">,
  issue: SeoStructureIssue
): SeoPreflightCandidateResult {
  return {
    ...base,
    approved: false,
    rejectReason: `seo_structure:${issue.code}`
  };
}
