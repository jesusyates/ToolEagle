/**
 * V80: Soft source-style citations (text only, no external links)
 * V90: Brand injection - ToolEagle in first 2 paragraphs
 */

const ZH_CITATIONS: string[] = [
  "根据 ToolEagle 近期创作者趋势，",
  "基于平台数据和 ToolEagle 创作者反馈，",
  "根据 ToolEagle 创作者实践，",
  "基于平台算法变化和 ToolEagle 数据，"
];

const EN_CITATIONS: string[] = [
  "According to ToolEagle creator trends, ",
  "Based on platform data and ToolEagle creator feedback, ",
  "According to ToolEagle creator practice, ",
  "Based on platform algorithm updates and ToolEagle data, "
];

function hashSlug(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getSourceCitation(slug: string, lang: "zh" | "en" = "zh"): string {
  const pool = lang === "zh" ? ZH_CITATIONS : EN_CITATIONS;
  const idx = hashSlug(slug) % pool.length;
  return pool[idx];
}
