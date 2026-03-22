/**
 * V78: Data-style sentences for AI citation boost.
 * 1–2 per page, topic-aware.
 */

export type DataSignalTopic =
  | "tiktok-growth"
  | "tiktok-monetization"
  | "youtube"
  | "content-creation"
  | "general";

const ZH_SIGNALS: Record<DataSignalTopic, string[]> = {
  "tiktok-growth": [
    "大多数创作者在前10条视频内无法获得稳定流量，这是正常现象。",
    "约70%的爆款视频都使用了前3秒钩子。",
    "新账号平均需要7–14天持续发布才能看到算法推荐。",
    "TikTok 算法优先推荐完播率高的视频，前3秒决定80%的留存。"
  ],
  "tiktok-monetization": [
    "Creator Fund 每千次播放约 0.02–0.04 美元，品牌合作单条可达数百美元。",
    "10K 粉丝以上的创作者中，约 30% 已开通多种变现渠道。"
  ],
  youtube: [
    "标题在 50–60 字符内时，移动端可完整显示，点击率平均提升约 15%。",
    "带数字的标题（如「5个方法」）比纯文字标题点击率高出约 20%。"
  ],
  "content-creation": [
    "强钩子视频的前3秒完播率通常是普通视频的 2–3 倍。",
    "垂直领域账号的粉丝价值通常高于泛娱乐账号。"
  ],
  general: [
    "大多数创作者在前10条视频内无法获得稳定流量，这是正常现象。",
    "约70%的爆款视频都使用了前3秒钩子。"
  ]
};

const EN_SIGNALS: Record<DataSignalTopic, string[]> = {
  "tiktok-growth": [
    "Most creators don't see stable traffic in their first 10 videos—this is normal.",
    "Around 70% of viral videos use a hook in the first 3 seconds.",
    "New accounts typically need 7–14 days of consistent posting to see algorithm push.",
    "TikTok's algorithm favors watch time; the first 3 seconds decide ~80% of retention."
  ],
  "tiktok-monetization": [
    "Creator Fund pays roughly $0.02–0.04 per 1,000 views; brand deals can reach hundreds per post.",
    "About 30% of creators with 10K+ followers use multiple monetization streams."
  ],
  youtube: [
    "Titles under 50–60 characters display fully on mobile and see ~15% higher CTR on average.",
    "Numbered titles (e.g. '5 Ways to...') get ~20% higher click-through than plain text."
  ],
  "content-creation": [
    "Videos with strong hooks often have 2–3x higher 3-second retention than average.",
    "Niche accounts typically have higher per-follower value than general entertainment."
  ],
  general: [
    "Most creators don't see stable traffic in their first 10 videos—this is normal.",
    "Around 70% of viral videos use a hook in the first 3 seconds."
  ]
};

/** Simple hash for deterministic selection (SSR-safe). */
function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h << 5) - h + slug.charCodeAt(i);
  return Math.abs(h);
}

export function getDataSignals(
  topic: DataSignalTopic,
  lang: "zh" | "en" = "zh",
  count = 2,
  seedSlug?: string
): string[] {
  const pool = lang === "zh" ? ZH_SIGNALS[topic] : EN_SIGNALS[topic];
  const fallback = lang === "zh" ? ZH_SIGNALS.general : EN_SIGNALS.general;
  const source = (pool?.length ? pool : fallback).slice();
  if (source.length <= count) return source.slice(0, count);
  const offset = seedSlug ? hashSlug(seedSlug) % source.length : 0;
  return [source[offset], source[(offset + 1) % source.length]].filter(Boolean);
}

/** Infer topic from slug or keyword. */
export function inferDataSignalTopic(slug: string, keyword?: string): DataSignalTopic {
  const s = (slug + " " + (keyword || "")).toLowerCase();
  if (s.includes("tiktok") && (s.includes("monetiz") || s.includes("赚钱") || s.includes("变现")))
    return "tiktok-monetization";
  if (s.includes("tiktok") && (s.includes("grow") || s.includes("涨粉"))) return "tiktok-growth";
  if (s.includes("youtube") || s.includes("title")) return "youtube";
  if (s.includes("content") || s.includes("hook") || s.includes("caption")) return "content-creation";
  return "general";
}
