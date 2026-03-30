/**
 * V171.1 — Optional usage counts for English tool entry cards.
 * Populate `generated/tool-usage-display.json` as { "slug": number } when telemetry is wired; until then cards show "—".
 */

import fs from "fs";
import path from "path";

type UsageMap = Record<string, number>;

let cached: UsageMap | null | undefined;

export function getToolUsageCountForDisplay(slug: string, cwd = process.cwd()): number | null {
  if (cached === undefined) {
    const p = path.join(cwd, "generated", "tool-usage-display.json");
    try {
      if (fs.existsSync(p)) {
        cached = JSON.parse(fs.readFileSync(p, "utf8")) as UsageMap;
      } else {
        cached = {};
      }
    } catch {
      cached = {};
    }
  }
  const n = cached![slug];
  return typeof n === "number" && n > 0 ? n : null;
}

export function formatUsageCountLabel(count: number | null): string {
  if (count == null || count <= 0) return "—";
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M uses`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k uses`;
  return `${count} uses`;
}
