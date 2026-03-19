/**
 * V68 - Fetch zh_tool_metrics for CTR-based tool sorting
 */
import { createAdminClient } from "@/lib/supabase/admin";
import type { AffiliateTool } from "@/config/affiliate-tools";

export type ToolMetric = { tool_id: string; views: number; clicks: number; ctr: number };

export async function getZhToolMetrics(): Promise<Map<string, ToolMetric>> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("zh_tool_metrics")
    .select("tool_id, views, clicks")
    .order("clicks", { ascending: false });

  if (error || !data) return new Map();

  const map = new Map<string, ToolMetric>();
  for (const row of data) {
    const views = row.views ?? 0;
    const clicks = row.clicks ?? 0;
    map.set(row.tool_id, {
      tool_id: row.tool_id,
      views,
      clicks,
      ctr: views > 0 ? clicks / views : 0
    });
  }
  return map;
}

/** Sort tools by CTR (highest first), fallback to isBestChoice then score */
export function sortToolsByCTR(
  tools: AffiliateTool[],
  metrics: Map<string, ToolMetric>
): AffiliateTool[] {
  if (tools.length === 0) return [];
  return [...tools].sort((a, b) => {
    const ctrA = metrics.get(a.id)?.ctr ?? 0;
    const ctrB = metrics.get(b.id)?.ctr ?? 0;
    if (ctrB !== ctrA) return ctrB - ctrA;
    if (a.isBestChoice && !b.isBestChoice) return -1;
    if (!a.isBestChoice && b.isBestChoice) return 1;
    return (b.rating ?? 0) - (a.rating ?? 0);
  });
}
