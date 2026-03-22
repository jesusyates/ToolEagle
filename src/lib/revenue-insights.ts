/**
 * V86.1: Revenue insight generation - "Why this works", "What's working"
 */

import { getAffiliateTools } from "@/config/affiliate-tools";

export function getToolNameById(toolId: string): string {
  const tools = getAffiliateTools();
  const t = tools.find((x) => x.id === toolId);
  return t?.name ?? toolId;
}

export function generateWhyThisWorks(
  toolName: string,
  pageSlug: string,
  keyword: string,
  clicks: number,
  ctr: string
): string {
  const parts: string[] = [];
  if (/变现|赚钱|引流/.test(keyword)) {
    parts.push(`High-intent keyword「${keyword}」drives monetization traffic`);
  }
  if (parseFloat(ctr) > 1.5) {
    parts.push(`Strong CTR (${ctr}%) shows effective placement`);
  }
  if (clicks >= 10) {
    parts.push(`${toolName} resonates with this audience`);
  }
  if (parts.length === 0) {
    parts.push(`Top performer — double down with more exposure`);
  }
  return parts.join(". ");
}

const INTENT_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /赚钱|变现|引流/, label: "赚钱/变现" },
  { pattern: /教程|入门|攻略/, label: "教程" },
  { pattern: /工具|软件/, label: "工具" },
  { pattern: /涨粉|播放量|爆款/, label: "涨粉/爆款" }
];

export function inferIntent(keyword: string): string {
  for (const { pattern, label } of INTENT_PATTERNS) {
    if (pattern.test(keyword)) return label;
  }
  return "general";
}
