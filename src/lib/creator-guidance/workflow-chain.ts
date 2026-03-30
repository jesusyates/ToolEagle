/**
 * V188 — Linear creator workflow: Hook → Caption → Hashtag → Title
 */

export const V188_WORKFLOW_CHAIN = [
  "hook-generator",
  "tiktok-caption-generator",
  "hashtag-generator",
  "title-generator"
] as const;

export type V188WorkflowTool = (typeof V188_WORKFLOW_CHAIN)[number];

export function workflowIndex(toolSlug: string): number {
  return V188_WORKFLOW_CHAIN.indexOf(toolSlug as V188WorkflowTool);
}

export function nextWorkflowTool(toolSlug: string): V188WorkflowTool | null {
  const i = workflowIndex(toolSlug);
  if (i < 0 || i >= V188_WORKFLOW_CHAIN.length - 1) return null;
  return V188_WORKFLOW_CHAIN[i + 1];
}

export function prevWorkflowTool(toolSlug: string): V188WorkflowTool | null {
  const i = workflowIndex(toolSlug);
  if (i <= 0) return null;
  return V188_WORKFLOW_CHAIN[i - 1];
}

export function nextWorkflowTitle(toolSlug: string): string {
  const n = nextWorkflowTool(toolSlug);
  if (!n) return "Keep iterating";
  switch (n) {
    case "tiktok-caption-generator":
      return "Generate full post package";
    case "hashtag-generator":
      return "Generate hashtag sets";
    case "title-generator":
      return "Generate clickable titles";
    case "hook-generator":
      return "Generate hooks";
    default:
      return "Continue";
  }
}

export function buildWorkflowHref(
  nextTool: string,
  opts: { intentId?: string | null; scenarioId?: string | null; topicHint?: string }
): string {
  const p = new URLSearchParams();
  p.set("workflow", "v188");
  if (opts.intentId) p.set("v186_intent", opts.intentId);
  if (opts.scenarioId) p.set("v186_scenario", opts.scenarioId);
  if (opts.topicHint?.trim()) p.set("q", opts.topicHint.trim().slice(0, 200));
  const qs = p.toString();
  return `/tools/${nextTool}${qs ? `?${qs}` : ""}`;
}

/** Upload destinations after copy (global EN). */
export function uploadUrlForPlatform(platform: "tiktok" | "youtube" | "instagram"): string {
  switch (platform) {
    case "tiktok":
      return "https://www.tiktok.com/upload";
    case "youtube":
      return "https://www.youtube.com/upload";
    case "instagram":
      return "https://www.instagram.com/";
    default:
      return "https://www.tiktok.com/upload";
  }
}

export function defaultUploadPlatformForTool(toolSlug: string): "tiktok" | "youtube" | "instagram" {
  const s = toolSlug.toLowerCase();
  if (s.includes("youtube")) return "youtube";
  if (s.includes("instagram")) return "instagram";
  return "tiktok";
}
