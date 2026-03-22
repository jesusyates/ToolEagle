import type { CreatorPostPackage } from "@/lib/ai/postPackage";

/** V97.1 — Section labels for results + clipboard export on China-local tool UI */
export const PACKAGE_SECTION_LABELS_ZH: Record<keyof CreatorPostPackage, string> = {
  topic: "选题 / 一句话主题",
  hook: "开头钩子",
  script_talking_points: "完整口播脚本 / 分镜",
  caption: "正文文案",
  cta_line: "评论引导 / 互动 CTA",
  hashtags: "话题标签",
  why_it_works: "一句话摘要",
  posting_tips: "发布与节奏建议",
  best_for: "最适合的场景",
  variation_pack: "变体包",
  hook_strength_label: "钩子强度",
  why_opening_grabs: "为什么这个开头能抓人",
  why_structure_completion: "为什么这个结构能提高完播率",
  why_copy_growth: "为什么这个文案适合带货 / 涨粉",
  context_account: "适合什么类型账号",
  context_scenario: "适合什么内容场景",
  context_audience: "适合什么受众",
  publish_rhythm: "可直接拍 · 分段与节奏",
  version_plain: "普通版本",
  version_optimized: "优化版本"
};
