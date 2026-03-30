import fs from "fs";
import path from "path";

export type V182ToolEntryBoost = {
  tier?: string;
  extra_related_placement?: boolean;
  trust_block_override?: "full" | "compact" | "none";
  short_click_path?: boolean;
};

export type V182RevenueEntryBoostDoc = {
  version?: string;
  tool_entry_boost?: Record<string, V182ToolEntryBoost>;
  related_tools_placement_boost?: string[];
  preferred_shorter_paths?: string[];
};

const EMPTY: V182RevenueEntryBoostDoc = {};

export function loadV182RevenueEntryBoost(): V182RevenueEntryBoostDoc {
  try {
    const fp = path.join(process.cwd(), "generated", "v182-revenue-entry-boost.json");
    if (!fs.existsSync(fp)) return EMPTY;
    const j = JSON.parse(fs.readFileSync(fp, "utf8")) as V182RevenueEntryBoostDoc;
    return j && typeof j === "object" ? j : EMPTY;
  } catch {
    return EMPTY;
  }
}

export function getV182ToolEntryBoost(doc: V182RevenueEntryBoostDoc, toolSlug: string): V182ToolEntryBoost | null {
  const t = doc.tool_entry_boost?.[toolSlug];
  return t ?? null;
}

/** High exact-revenue tools to surface as extra related links (excluding current page tool). */
export function getV182PlacementRelatedSlugs(doc: V182RevenueEntryBoostDoc, currentToolSlug: string): string[] {
  const raw = doc.related_tools_placement_boost || [];
  return raw.filter((s) => s && s !== currentToolSlug);
}
