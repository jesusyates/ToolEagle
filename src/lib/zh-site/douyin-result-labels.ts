import type { CreatorPostPackage } from "@/lib/ai/postPackage";

/** V109.2 — 抖音结果区：更贴近「可发抖音」的字段命名（覆盖通用中文标签） */
export const DOUYIN_RESULT_LABELS: Partial<Record<keyof CreatorPostPackage, string>> = {
  topic: "选题 · 一句话拍什么",
  hook: "开头（前 1–3 秒）",
  script_talking_points: "口播 / 中段结构",
  caption: "描述区正文（可直接贴抖音）",
  cta_line: "评论引导（置顶可用）",
  hashtags: "话题标签",
  why_it_works: "一句话摘要",
  posting_tips: "发布备注（含节奏）"
};

/** 轻量角色标签，用于结果卡片角标 */
export function douyinFieldRoleTag(key: keyof CreatorPostPackage): string | null {
  const m: Partial<Record<keyof CreatorPostPackage, string>> = {
    topic: "选题",
    hook: "开头",
    script_talking_points: "结构",
    caption: "描述区",
    cta_line: "评论引导",
    hashtags: "话题",
    posting_tips: "发布备注",
    why_it_works: "摘要",
    why_opening_grabs: "开头",
    why_structure_completion: "完播",
    why_copy_growth: "转化",
    publish_rhythm: "节奏"
  };
  return m[key] ?? null;
}
