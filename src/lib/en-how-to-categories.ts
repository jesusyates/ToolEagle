import { getAllEnHowToSlugs, getEnHowToContent, type EnHowToContent } from "@/lib/en-how-to-content";

export type EnHowToCategorySlug =
  | "tiktok"
  | "youtube"
  | "instagram"
  | "monetization"
  | "growth";

export const EN_HOW_TO_CATEGORIES: { slug: EnHowToCategorySlug; label: string }[] = [
  { slug: "tiktok", label: "TikTok" },
  { slug: "youtube", label: "YouTube" },
  { slug: "instagram", label: "Instagram" },
  { slug: "monetization", label: "Monetization" },
  { slug: "growth", label: "Growth" }
];

export function inferEnHowToCategory(slug: string): EnHowToCategorySlug {
  const s = slug.toLowerCase();
  if (s.includes("tiktok")) return "tiktok";
  if (s.includes("youtube")) return "youtube";
  if (s.includes("instagram")) return "instagram";
  if (s.includes("monetiz") || s.includes("make-money") || s.includes("affiliate")) {
    return "monetization";
  }
  return "growth";
}

export function getEnHowToItemsByCategory(category: EnHowToCategorySlug): EnHowToContent[] {
  return getAllEnHowToSlugs()
    .map((slug) => getEnHowToContent(slug))
    .filter((item): item is EnHowToContent => item !== null)
    .filter((item) => inferEnHowToCategory(item.slug) === category);
}

