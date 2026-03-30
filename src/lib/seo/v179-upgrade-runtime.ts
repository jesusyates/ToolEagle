import "server-only";

import fs from "fs";
import path from "path";

import { isV177AutoExecutionEnabled } from "@/lib/seo/v178-full-surface-manifest";

export type V179ToolRuntime = {
  surface_level?: string;
  upgrade_boost?: "max" | "standard";
  workflow_upgrade_mode?: "subtle" | "default";
  ab_upgrade_copy?: "a" | "b";
};

export type V179UpgradeRuntimeDoc = {
  version: string;
  builtAt: string;
  dry_run?: boolean;
  tools: Record<string, V179ToolRuntime>;
  blogs: Record<string, { surface_level?: string; mid_workflow_cta?: boolean; ab_variant?: string }>;
  answers_default?: { surface_level?: string; upgrade_near_primary?: boolean };
};

const EMPTY: V179UpgradeRuntimeDoc = {
  version: "179",
  builtAt: "",
  tools: {},
  blogs: {},
  answers_default: {}
};

export function loadV179UpgradeRuntime(): V179UpgradeRuntimeDoc {
  if (!isV177AutoExecutionEnabled()) return EMPTY;

  const fp = path.join(process.cwd(), "generated", "v179-upgrade-runtime.json");
  try {
    if (!fs.existsSync(fp)) return EMPTY;
    const raw = fs.readFileSync(fp, "utf8");
    const j = JSON.parse(raw) as V179UpgradeRuntimeDoc;
    if (!j || String(j.version) !== "179" || !j.tools) return EMPTY;
    if (j.dry_run) return EMPTY;
    return j;
  } catch {
    return EMPTY;
  }
}

export function getV179ToolBoost(doc: V179UpgradeRuntimeDoc, toolSlug: string): V179ToolRuntime | null {
  return doc.tools[toolSlug] ?? null;
}

export function getV179BlogBoost(doc: V179UpgradeRuntimeDoc, blogSlug: string) {
  return doc.blogs[blogSlug] ?? null;
}

export function v179AnswersUpgradeNearPrimary(doc: V179UpgradeRuntimeDoc): boolean {
  return Boolean(doc.answers_default?.upgrade_near_primary);
}
