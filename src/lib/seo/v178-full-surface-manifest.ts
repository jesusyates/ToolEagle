import "server-only";

import fs from "fs";
import path from "path";

export type V178WorkflowStep = { href: string; label: string };

export type V178ToolSurface = {
  extraRelatedSlugs: string[];
  workflowExtra: V178WorkflowStep[];
  showConversionPath: boolean;
};

export type V178AnswerSurface = {
  toolSlug: string;
  extraRelatedToolSlugs: string[];
  workflowToTool: V178WorkflowStep[];
  emphasizePrimaryCta: boolean;
};

export type V178FullSurfaceManifest = {
  version: string;
  builtAt: string;
  dry_run: boolean;
  tools: Record<string, V178ToolSurface>;
  answers: Record<string, V178AnswerSurface>;
};

const MANIFEST_VERSIONS = new Set(["178", "178.1"]);

const EMPTY: V178FullSurfaceManifest = {
  version: "178.1",
  builtAt: "",
  dry_run: false,
  tools: {},
  answers: {}
};

export function isV177AutoExecutionEnabled(): boolean {
  return process.env.V177_AUTO_EXECUTION === "1";
}

/**
 * Full-surface auto UI (tools + answers) reads generated/v178-full-surface-manifest.json
 * when V177_AUTO_EXECUTION=1. Manifest is written by scripts/run-v177-auto-execution.js.
 */
export function loadV178FullSurfaceManifest(): V178FullSurfaceManifest {
  if (!isV177AutoExecutionEnabled()) return EMPTY;

  const fp = path.join(process.cwd(), "generated", "v178-full-surface-manifest.json");
  try {
    if (!fs.existsSync(fp)) return EMPTY;
    const raw = fs.readFileSync(fp, "utf8");
    const j = JSON.parse(raw) as V178FullSurfaceManifest;
    if (!j || !MANIFEST_VERSIONS.has(String(j.version)) || !j.tools || !j.answers) return EMPTY;
    if (j.dry_run) return EMPTY;
    return j;
  } catch {
    return EMPTY;
  }
}

export function getV178ToolSurface(
  manifest: V178FullSurfaceManifest,
  toolSlug: string
): V178ToolSurface | null {
  return manifest.tools[toolSlug] ?? null;
}

export function getV178AnswerSurface(
  manifest: V178FullSurfaceManifest,
  answerSlug: string
): V178AnswerSurface | null {
  return manifest.answers[answerSlug] ?? null;
}
