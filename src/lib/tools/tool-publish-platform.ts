/**
 * V171.1 — Map tool slug → creator upload surface for post-copy modal (EN tools).
 */

export type PublishPlatformId = "tiktok" | "youtube" | "instagram";

const UPLOAD_URL: Record<PublishPlatformId, string> = {
  tiktok: "https://www.tiktok.com/upload",
  youtube: "https://www.youtube.com/upload",
  instagram: "https://www.instagram.com/"
};

export function resolvePublishPlatform(slug: string): PublishPlatformId | null {
  const s = slug.toLowerCase();
  if (s.includes("youtube") || s.includes("shorts-title") || s === "youtube-script-generator")
    return "youtube";
  if (
    s.includes("instagram") ||
    s.includes("reel-") ||
    s.startsWith("reel-") ||
    s.includes("ig-")
  )
    return "instagram";
  if (
    s.includes("tiktok") ||
    s === "hook-generator" ||
    s === "hashtag-generator" ||
    s === "title-generator" ||
    s === "ai-caption-generator"
  )
    return "tiktok";
  return null;
}

export function getPublishUrlForToolSlug(slug: string): string | null {
  const p = resolvePublishPlatform(slug);
  return p ? UPLOAD_URL[p] : null;
}
