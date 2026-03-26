import { TOOL_PAGE_COPY_EN } from "@/config/tool-page-copy-en";
import { TOOL_PAGE_COPY_ZH } from "@/config/tool-page-copy-zh";

const MAX_META = 155;
const MAX_CARD = 160;

function truncateHeroLine(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 48 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

/** Meta / OG / Twitter description — aligned with on-page hero, shortened for SERP. */
export function getToolMetaDescriptionEn(slug: string): string | undefined {
  const hero = TOOL_PAGE_COPY_EN[slug]?.hero;
  if (!hero) return undefined;
  return truncateHeroLine(hero, MAX_META);
}

/** Tool cards & directory blurbs — same hero, slightly longer than meta. */
export function getToolCardBody(
  locale: "en" | "zh",
  slug: string,
  fallbackEn: string,
  fallbackZh?: string
): string {
  if (locale === "zh") {
    const hero = TOOL_PAGE_COPY_ZH[slug]?.hero;
    if (hero) return truncateHeroLine(hero, MAX_CARD);
    if (fallbackZh?.trim()) return fallbackZh;
    return fallbackEn;
  }
  const hero = TOOL_PAGE_COPY_EN[slug]?.hero;
  if (hero) return truncateHeroLine(hero, MAX_CARD);
  return fallbackEn;
}
