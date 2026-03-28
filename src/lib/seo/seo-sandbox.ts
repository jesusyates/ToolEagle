/**
 * V157 — Dry-run / sandbox mode for SEO production entry points.
 * Child scripts honor process.env.SEO_DRY_RUN=1 or SEO_SANDBOX=1.
 */

import path from "path";

export type SeoProductionRunMode = "live" | "dry_run" | "check_only";

/** CLI flags for orchestrator / background engine / watchdog. */
export function parseSeoCliMode(argv: string[]): SeoProductionRunMode {
  if (argv.includes("--check-only") || argv.includes("--check")) return "check_only";
  if (argv.includes("--dry-run") || argv.includes("--sandbox")) return "dry_run";
  return "live";
}

export function seoSandboxDir(cwd: string): string {
  return path.join(cwd, "generated", "sandbox");
}

export function sandboxPipelineStatePath(cwd: string): string {
  return path.join(seoSandboxDir(cwd), "seo-pipeline-state.json");
}

/** True when this process should not mutate live publish artifacts (set by env or parent). */
export function isSeoDryRunEnv(): boolean {
  return process.env.SEO_DRY_RUN === "1" || process.env.SEO_SANDBOX === "1";
}

/** Live `generated/` or sandbox output root for SEO artifacts. */
export function resolveSeoGeneratedDir(cwd: string): string {
  return isSeoDryRunEnv() ? seoSandboxDir(cwd) : path.join(cwd, "generated");
}

/**
 * True when this file is being run as the CLI target (not merely imported).
 * `npx tsx` may place the script in argv[2], so we scan argv.
 */
export function isPrimaryScriptEntry(scriptBasename: string): boolean {
  const needle = scriptBasename.replace(/\\/g, "/");
  return process.argv.slice(1).some((a) => {
    const norm = (a || "").replace(/\\/g, "/");
    return norm.endsWith(needle) || norm.includes(`/${needle}`);
  });
}
