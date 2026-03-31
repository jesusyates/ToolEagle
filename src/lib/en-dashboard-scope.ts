import { tools } from "@/config/tools";

/**
 * 英文主站仪表盘：避免把中文站（`cnOnly`）工具记录展示到英文端。
 * 规则：排除 `tools.ts` 里标记了 `cnOnly: true` 的 slug。
 */
const CN_ONLY_SLUGS = new Set(
  tools.filter((t) => t.cnOnly).map((t) => t.slug)
);

export function isEnDashboardAllowedToolSlug(slug: string): boolean {
  // 允许未知 slug（假设它们是英文/global 工具），只过滤 cnOnly 这一类明确的“中文专属”。
  return !CN_ONLY_SLUGS.has(slug);
}

