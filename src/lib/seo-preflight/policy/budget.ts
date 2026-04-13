import type { SeoPreflightContentType } from "../types/preflight";

const BASE_BY_TYPE: Record<SeoPreflightContentType, number> = {
  guide: 0.12,
  how_to: 0.1,
  comparison: 0.09,
  listicle: 0.08
};

/** Cheap outline + validation only — no full article; fixed heuristic units (relative dollars). */
export function estimatePreflightCandidateCost(contentType: SeoPreflightContentType): number {
  return BASE_BY_TYPE[contentType] ?? 0.1;
}
