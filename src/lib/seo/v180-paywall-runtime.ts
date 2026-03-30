import "server-only";

import fs from "fs";
import path from "path";

import { isV177AutoExecutionEnabled } from "@/lib/seo/v178-full-surface-manifest";

export type V180ToolPaywall = {
  trust_block?: "none" | "compact" | "full";
  workflow_upgrade_hidden?: boolean;
  paywall_ab?: "a" | "b";
};

export type V180PaywallRuntimeDoc = {
  version: string;
  builtAt: string;
  dry_run?: boolean;
  tools: Record<string, V180ToolPaywall>;
};

const EMPTY: V180PaywallRuntimeDoc = {
  version: "180.1",
  builtAt: "",
  tools: {}
};

export function loadV180PaywallRuntime(): V180PaywallRuntimeDoc {
  if (!isV177AutoExecutionEnabled()) return EMPTY;

  const fp = path.join(process.cwd(), "generated", "v180-paywall-runtime.json");
  try {
    if (!fs.existsSync(fp)) return EMPTY;
    const j = JSON.parse(fs.readFileSync(fp, "utf8")) as V180PaywallRuntimeDoc;
    if (!j || !String(j.version || "").startsWith("180") || !j.tools) return EMPTY;
    if (j.dry_run) return EMPTY;
    return j;
  } catch {
    return EMPTY;
  }
}

export function getV180ToolPaywall(doc: V180PaywallRuntimeDoc, toolSlug: string): V180ToolPaywall | null {
  return doc.tools[toolSlug] ?? null;
}
