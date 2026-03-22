import type { PostPackageToolKind } from "@/lib/ai/postPackage";

/** Platform / tool-type angles — shared across markets, composed into user prompt. */

export function platformPostPackageAngle(toolKind: PostPackageToolKind): string {
  if (toolKind === "tiktok_caption") {
    return "Optimize for TikTok-native tone: fast, conversational, trend-aware. Caption should feel ready to paste.";
  }
  if (toolKind === "hook_focus") {
    return "Lead with scroll-stopping hooks; first line must be the strongest pattern-interrupt. Caption supports the hook.";
  }
  if (toolKind === "douyin_topic") {
    return `This tool is Douyin TOPIC / NICHE idea generation (抖音选题). Use the SAME JSON keys but fill them with this meaning (all in Chinese for zh locale):
- hook: one-line summary of the batch direction (who this is for + angle).
- script_talking_points: 5–8 concrete topic ideas, numbered or line-separated; each idea is shootable in 15–45s on Douyin.
- caption: 赛道/分类 (e.g. 同城、带货、知识口播、情绪、娱乐) — short label(s).
- cta_line: one line on how to turn a topic into comment/DM/到店 interaction.
- hashtags: space-separated #tags for Douyin discovery.
- why_it_works: why these topics fit Douyin completion + comment patterns (2–3 sentences).
- posting_tips: 2–3 bullets: cadence, A/B tests, what to avoid.
- best_for: which account types / stages should pick these topics.`;
  }
  if (toolKind === "douyin_comment_cta") {
    return `This tool is Douyin COMMENT / ENGAGEMENT CTA lines (抖音评论引导). Same JSON keys, semantic mapping (Chinese for zh):
- hook: a pinned-comment style line or “首评” opener that invites replies.
- script_talking_points: multiple lines: 评论话术、接龙模板、选择题式互动、争议点（合规内）— newline bullets.
- caption: 适用场景（视频类型、评论区情境、人群）— 1–3 short sentences.
- cta_line: strong 促评/私信/领资料 引导（合规、可执行）.
- hashtags: optional #tags.
- why_it_works: why this drives comments and replays on Douyin.
- posting_tips: timing, where to place the CTA, pitfalls.
- best_for: content types that fit these phrases.`;
  }
  if (toolKind === "douyin_structure") {
    return `This tool is Douyin VIDEO STRUCTURE (抖音内容结构): hook → middle flow → ending CTA. Same JSON keys:
- hook: 开头钩子（1–3 句，停滑+身份/结果前置）.
- script_talking_points: 中段内容流：分镜或气口，换行分条，对齐完播（不要堆三个观点）.
- caption: 节奏与信息密度说明（一句）或过渡句.
- cta_line: 结尾强 CTA（评论/私信/到店/关注）— 可执行指令.
- hashtags: #话题标签.
- why_it_works: why this structure works for Douyin completion + conversion.
- posting_tips: 拍摄/剪辑/描述区配合.
- best_for: 最适合的场景或账号阶段.`;
  }
  return "Platform-agnostic AI caption kit: works for TikTok, Reels, and Shorts. Balance clarity and personality.";
}
