/**
 * Platform + content type → tool mapping for public submissions
 */

export type SubmitPlatform = "tiktok" | "youtube" | "instagram";
export type SubmitContentType = "caption" | "hook" | "title";

export const PLATFORM_CONTENT_TOOL: Record<
  SubmitPlatform,
  Record<SubmitContentType, { slug: string; name: string }>
> = {
  tiktok: {
    caption: { slug: "tiktok-caption-generator", name: "TikTok Caption Generator" },
    hook: { slug: "hook-generator", name: "Hook Generator" },
    title: { slug: "title-generator", name: "Title Generator" }
  },
  youtube: {
    caption: { slug: "youtube-description-generator", name: "YouTube Description Generator" },
    hook: { slug: "hook-generator", name: "Hook Generator" },
    title: { slug: "youtube-title-generator", name: "YouTube Title Generator" }
  },
  instagram: {
    caption: { slug: "instagram-caption-generator", name: "Instagram Caption Generator" },
    hook: { slug: "hook-generator", name: "Hook Generator" },
    title: { slug: "title-generator", name: "Title Generator" }
  }
};

export function getToolForSubmit(platform: SubmitPlatform, contentType: SubmitContentType) {
  return PLATFORM_CONTENT_TOOL[platform]?.[contentType] ?? {
    slug: "tiktok-caption-generator",
    name: "TikTok Caption Generator"
  };
}
