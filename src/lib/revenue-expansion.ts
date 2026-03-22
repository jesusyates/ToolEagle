/**
 * V87: Revenue Scaling - Winning pattern replication
 * Expand top keywords into 50-200 new page candidates
 */

const PLATFORMS = ["tiktok", "youtube", "instagram"] as const;
const PLATFORM_NAMES: Record<string, string> = { tiktok: "TikTok", youtube: "YouTube", instagram: "Instagram" };
const GOAL_SLUGS: Record<string, string> = {
  涨粉: "zhangfen", "获得播放量": "bofangliang", 变现: "bianxian",
  引流: "yinliu", "做爆款": "baokuan-v2", "做内容": "neirong",
  账号起号: "qihao", "提高互动率": "hudong", "做爆款视频": "baokuan",
  赚钱: "bianxian"
};

const EXPANSION_SUFFIXES = [
  { suffix: "方法", slug: "fangfa" },
  { suffix: "新手", slug: "xinshou" },
  { suffix: "工具", slug: "gongju" },
  { suffix: "教程", slug: "jiaocheng" },
  { suffix: "2026", slug: "2026" },
  { suffix: "技巧", slug: "jiqiao" },
  { suffix: "攻略", slug: "gonglue" }
];

function inferPlatform(keyword: string): string {
  if (/TikTok|抖音/.test(keyword)) return "tiktok";
  if (/YouTube|油管/.test(keyword)) return "youtube";
  if (/Instagram|ins/.test(keyword)) return "instagram";
  return "tiktok";
}

function inferGoal(keyword: string): string {
  if (/变现/.test(keyword)) return "变现";
  if (/赚钱/.test(keyword)) return "变现";
  if (/引流/.test(keyword)) return "引流";
  if (/涨粉/.test(keyword)) return "涨粉";
  if (/爆款/.test(keyword)) return "做爆款";
  return "变现";
}

function getGoalSlug(goal: string): string {
  return GOAL_SLUGS[goal] ?? goal.replace(/\s/g, "-").toLowerCase();
}

export interface ExpansionCandidate {
  keyword: string;
  slug: string;
  platform: string;
  goal: string;
  sourceKeyword: string;
  variation: string;
}

/**
 * Expand a single keyword into variations
 * TikTok 变现 → TikTok 变现 方法, TikTok 变现 新手, YouTube 变现 方法, etc.
 */
export function expandKeyword(
  keyword: string,
  options?: { crossPlatform?: boolean; maxPerKeyword?: number }
): ExpansionCandidate[] {
  const crossPlatform = options?.crossPlatform ?? true;
  const maxPerKeyword = options?.maxPerKeyword ?? 50;
  const results: ExpansionCandidate[] = [];
  const seen = new Set<string>();

  const platform = inferPlatform(keyword);
  const goal = inferGoal(keyword);
  const baseName = PLATFORM_NAMES[platform];
  const goalSlug = getGoalSlug(goal);

  const platformsToUse = crossPlatform ? PLATFORMS : [platform];

  for (const p of platformsToUse) {
    const pName = PLATFORM_NAMES[p];
    for (const { suffix, slug } of EXPANSION_SUFFIXES) {
      const expandedKeyword = `${pName} ${goal} ${suffix}`.replace(/\s+/g, " ").trim();
      const candidateSlug = `${p}-${goalSlug}-${slug}`;
      if (seen.has(candidateSlug)) continue;
      seen.add(candidateSlug);
      results.push({
        keyword: expandedKeyword,
        slug: candidateSlug,
        platform: p,
        goal,
        sourceKeyword: keyword,
        variation: suffix
      });
      if (results.length >= maxPerKeyword) return results;
    }
    const baseOnly = `${pName} ${goal}`.trim();
    const baseSlug = `${p}-${goalSlug}-ruhe`;
    if (!seen.has(baseSlug)) {
      seen.add(baseSlug);
      results.push({
        keyword: baseOnly,
        slug: baseSlug,
        platform: p,
        goal,
        sourceKeyword: keyword,
        variation: "base"
      });
    }
  }
  return results;
}

/**
 * Expand top keywords into full candidate list (50-200)
 */
export function expandWinningKeywords(
  topKeywords: string[],
  topPages: { slug: string; keyword: string }[],
  topTools: string[],
  options?: { maxTotal?: number }
): {
  candidates: ExpansionCandidate[];
  bySource: Map<string, ExpansionCandidate[]>;
} {
  const maxTotal = options?.maxTotal ?? 200;
  const bySource = new Map<string, ExpansionCandidate[]>();
  const allCandidates: ExpansionCandidate[] = [];
  const seenSlugs = new Set<string>(topPages.map((p) => p.slug));

  const keywordsToExpand = topKeywords.slice(0, 3);
  const perKeyword = Math.ceil(maxTotal / Math.max(keywordsToExpand.length, 1));

  for (const kw of keywordsToExpand) {
    const expanded = expandKeyword(kw, {
      crossPlatform: true,
      maxPerKeyword: Math.min(perKeyword, 70)
    });
    const filtered = expanded.filter((c) => !seenSlugs.has(c.slug));
    for (const c of filtered) {
      if (!seenSlugs.has(c.slug)) {
        seenSlugs.add(c.slug);
        allCandidates.push(c);
      }
    }
    bySource.set(kw, filtered);
    if (allCandidates.length >= maxTotal) break;
  }
  return {
    candidates: allCandidates.slice(0, maxTotal),
    bySource
  };
}

/**
 * Internal link structure for a new page
 */
export function getInternalLinkStructure(
  mainMoneyPage: { slug: string; keyword: string },
  topToolGoSlug: string,
  relatedPages: { slug: string; keyword: string }[]
): {
  mainPageLink: string;
  topToolLink: string;
  relatedLinks: { href: string; label: string }[];
} {
  return {
    mainPageLink: `/zh/search/${mainMoneyPage.slug}`,
    topToolLink: `/go/${topToolGoSlug}`,
    relatedLinks: relatedPages.slice(0, 10).map((p) => ({
      href: `/zh/search/${p.slug}`,
      label: p.keyword
    }))
  };
}
