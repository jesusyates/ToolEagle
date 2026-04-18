import type { SeoPreflightContentType } from "../types/preflight";

const BASE_BY_TYPE: Record<SeoPreflightContentType, number> = {
  guide: 0.12,
  how_to: 0.1,
  comparison: 0.09,
  listicle: 0.08,
  problem_solution: 0.11,
  mistakes: 0.1,
  comparison_from_experience: 0.11,
  myth_busting: 0.1,
  pattern_breakdown: 0.1,
  scenario_specific: 0.1
};

/** Cheap outline + validation only — no full article; fixed heuristic units (relative dollars). */
export function estimatePreflightCandidateCost(contentType: SeoPreflightContentType): number {
  return BASE_BY_TYPE[contentType] ?? 0.1;
}
