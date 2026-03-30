/**
 * Internal linking: map platform/type to relevant /answers slugs
 * Used by SEO pages, blog, and tools
 */

import { getAllAnswerSlugs } from "./answers";
import { getAnswerPage } from "./answers";
import { loadContentQualityStatus, shouldHardExcludeFromInternalLinks } from "@/lib/seo/load-content-quality-status";

export type AnswerLink = { slug: string; title: string };

/** Get answer slugs relevant to platform + content type */
export function getAnswersForPlatformType(
  platform: string,
  type: string,
  limit = 3
): AnswerLink[] {
  const slugs = getAllAnswerSlugs();
  const platformLower = platform.toLowerCase();
  const typeLower = type.toLowerCase();

  const scored = slugs
    .map((slug) => {
      const page = getAnswerPage(slug);
      if (!page) return { slug, score: 0 };
      let score = 0;
      if (page.platform === platformLower) score += 2;
      if (
        (typeLower.includes("caption") && slug.includes("caption")) ||
        (typeLower.includes("hook") && slug.includes("hook")) ||
        (typeLower.includes("title") && slug.includes("title")) ||
        (typeLower.includes("hashtag") && slug.includes("hashtag")) ||
        (typeLower.includes("bio") && slug.includes("bio"))
      ) {
        score += 2;
      }
      if (slug.startsWith(`${platformLower}-`)) score += 1;
      return { slug, score, title: page.question };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const cq = loadContentQualityStatus();
  const filtered = scored.filter((x) => !shouldHardExcludeFromInternalLinks(`/answers/${x.slug}`, cq));

  return filtered.slice(0, limit).map(({ slug, title }) => ({ slug, title: title ?? slug }));
}

/** Generic "More answers" links for any page */
export function getFeaturedAnswerLinks(limit = 5): AnswerLink[] {
  const featured = [
    "how-to-write-tiktok-captions",
    "how-to-write-youtube-hooks",
    "how-to-write-instagram-captions",
    "best-caption-length",
    "how-to-write-viral-hooks"
  ];
  const slugs = getAllAnswerSlugs();
  const cq = loadContentQualityStatus();
  const available = featured.filter(
    (s) => slugs.includes(s) && !shouldHardExcludeFromInternalLinks(`/answers/${s}`, cq)
  );
  return available.slice(0, limit).map((slug) => {
    const page = getAnswerPage(slug);
    return { slug, title: page?.question ?? slug };
  });
}
