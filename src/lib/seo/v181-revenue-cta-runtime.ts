import "server-only";

import fs from "fs";
import path from "path";

import { isV177AutoExecutionEnabled } from "@/lib/seo/v178-full-surface-manifest";

export type V181RevenueCtaTool = {
  v181_tier?: string;
  trust_block?: "none" | "compact" | "full";
  workflow_upgrade_hidden?: boolean;
  paywall_ab?: "a" | "b";
  cta_density?: "low" | "medium" | "high";
  prefer_short_tool_path?: boolean;
  upgrade_boost_hint?: "max" | "standard";
  revenue_exact_paid_conversions?: number;
};

export type V181RevenueCtaRuntimeDoc = {
  version: string;
  builtAt: string;
  note?: string;
  tools: Record<string, V181RevenueCtaTool>;
};

const EMPTY: V181RevenueCtaRuntimeDoc = {
  version: "181",
  builtAt: "",
  tools: {}
};

export function loadV181RevenueCtaRuntime(): V181RevenueCtaRuntimeDoc {
  if (!isV177AutoExecutionEnabled()) return EMPTY;

  const fp = path.join(process.cwd(), "generated", "v181-revenue-cta-runtime.json");
  try {
    if (!fs.existsSync(fp)) return EMPTY;
    const j = JSON.parse(fs.readFileSync(fp, "utf8")) as V181RevenueCtaRuntimeDoc;
    if (!j || !String(j.version || "").startsWith("181") || !j.tools) return EMPTY;
    return j;
  } catch {
    return EMPTY;
  }
}

export function getV181ToolCta(doc: V181RevenueCtaRuntimeDoc, toolSlug: string): V181RevenueCtaTool | null {
  return doc.tools[toolSlug] ?? null;
}
