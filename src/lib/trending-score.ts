/**
 * Trending Score - v27
 * score = likes*5 + saves*3 + recentness + creator_popularity
 */

export function computeRecentnessScore(createdAt: Date): number {
  const now = new Date();
  const hours = (now.getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  if (hours <= 24) return 10;
  if (hours <= 168) return 5; // 7 days
  return 0;
}

export function computeTrendingScore(params: {
  likes: number;
  saves: number;
  createdAt: Date;
  creatorFollowers?: number;
}): number {
  const { likes, saves, createdAt, creatorFollowers = 0 } = params;
  const recentness = computeRecentnessScore(createdAt);
  const popularity = Math.min(creatorFollowers / 100, 10);
  return likes * 5 + saves * 3 + recentness + popularity;
}

export type TrendingItem = {
  slug: string;
  tool_name: string;
  result: string;
  creator_username: string | null;
  created_at: string;
  likes_count?: number;
  saves_count?: number;
};

export function sortByTrendingScore<T extends TrendingItem>(
  items: T[],
  likesMap: Record<string, number>,
  savesMap: Record<string, number>,
  creatorFollowersMap: Record<string, number> = {}
): T[] {
  return [...items].sort((a, b) => {
    const scoreA = computeTrendingScore({
      likes: likesMap[a.slug] ?? 0,
      saves: savesMap[a.slug] ?? 0,
      createdAt: new Date(a.created_at),
      creatorFollowers: a.creator_username ? creatorFollowersMap[a.creator_username] ?? 0 : 0
    });
    const scoreB = computeTrendingScore({
      likes: likesMap[b.slug] ?? 0,
      saves: savesMap[b.slug] ?? 0,
      createdAt: new Date(b.created_at),
      creatorFollowers: b.creator_username ? creatorFollowersMap[b.creator_username] ?? 0 : 0
    });
    return scoreB - scoreA;
  });
}
