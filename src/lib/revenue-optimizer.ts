/**
 * V70 Revenue Automation - Auto winner selection & losing tool suppression
 */
import type { AffiliateTool } from "@/config/affiliate-tools";
import { getPayoutPerClick } from "@/config/affiliate-tools";
import type { ToolMetric } from "./zh-tool-metrics";

/** Revenue score: (CTR * 0.7) + (payoutWeight * 0.3). Higher = better. */
export function getRevenueScore(
  tool: AffiliateTool,
  ctr: number,
  metrics: Map<string, ToolMetric>
): number {
  const payout = getPayoutPerClick(tool);
  const payoutWeight = Math.min(payout / 1.5, 1); // normalize to 0-1
  return ctr * 0.7 + payoutWeight * 0.3;
}

/** Sort tools by revenue score (winning tools first) */
export function sortToolsByRevenueScore(
  tools: AffiliateTool[],
  metrics: Map<string, ToolMetric>
): AffiliateTool[] {
  if (tools.length === 0) return [];
  return [...tools].sort((a, b) => {
    const mA = metrics.get(a.id);
    const mB = metrics.get(b.id);
    const ctrA = mA?.ctr ?? 0;
    const ctrB = mB?.ctr ?? 0;
    const scoreA = getRevenueScore(a, ctrA, metrics);
    const scoreB = getRevenueScore(b, ctrB, metrics);
    return scoreB - scoreA;
  });
}

/** V70: Losing tool - views > 100 and CTR < 1%. Suppress from first block. */
export function isLosingTool(metrics: Map<string, ToolMetric>, toolId: string): boolean {
  const m = metrics.get(toolId);
  if (!m) return false;
  return m.views > 100 && m.ctr < 0.01;
}

/** Filter out losing tools from primary display, or move to end */
export function applyLosingToolSuppression(
  tools: AffiliateTool[],
  metrics: Map<string, ToolMetric>,
  hideFromFirst = false
): AffiliateTool[] {
  if (tools.length === 0) return [];
  const winners: AffiliateTool[] = [];
  const losers: AffiliateTool[] = [];
  for (const t of tools) {
    if (isLosingTool(metrics, t.id)) losers.push(t);
    else winners.push(t);
  }
  if (hideFromFirst && losers.length > 0) {
    return [...winners, ...losers];
  }
  return [...winners, ...losers];
}
