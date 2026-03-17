/**
 * V66 Content Expansion Layer - 300-500 chars extra content per page
 */

const EXPANSION_BLOCKS: string[] = [
  "除了以上方法，建议定期复盘数据：哪些内容获得了更多互动？用户的反馈是什么？根据数据调整策略，才能持续进步。创作者之路没有捷径，但用对工具和方法，可以少走很多弯路。",
  "最后提醒一点：内容创作是长期工程，不要期待一夜爆红。坚持输出优质内容，配合平台算法和用户喜好，流量会逐步积累。同时，善用 AI 工具提升效率，把时间花在创意和互动上。",
  "如果你刚开始做内容，建议先选定一个垂直领域深耕，不要频繁换赛道。在一个领域积累足够多的作品和粉丝后，再考虑扩展。专注比泛化更容易做出成绩。"
];

/** Deterministic expansion block by slug */
function hashSlug(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getExpansionBlock(slug: string): string {
  const idx = hashSlug(slug) % EXPANSION_BLOCKS.length;
  return EXPANSION_BLOCKS[idx];
}
