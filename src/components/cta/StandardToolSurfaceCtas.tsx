/**
 * V171.2 — Canonical tool-page CTA zones (documentation + composition helpers).
 * Implementations live in ToolInputCard / ToolNextSteps / PostPackageToolClient / SeoToolCTA.
 * V178 — structured conversion strip: `ToolAutoConversionPathCard` (cta/AutoConversionPathCard) in tool aside
 * when `V177_AUTO_EXECUTION=1` and `generated/v178-full-surface-manifest.json` applies.
 */
export const TOOL_CTA_ZONES = ["hero", "post_generate", "workflow"] as const;

export type ToolCtaZone = (typeof TOOL_CTA_ZONES)[number];
