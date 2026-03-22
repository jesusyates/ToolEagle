/**
 * V95: Save structured packages locally as reusable templates (no new auth).
 */

import type { CreatorPostPackage } from "@/lib/ai/postPackage";
import { formatPackageAsPlainText } from "@/lib/ai/postPackage";

const KEY = "tooleagle_saved_templates";

export type SavedTemplate = {
  id: string;
  toolSlug: string;
  label: string;
  package: CreatorPostPackage;
  savedAt: number;
};

function readAll(): SavedTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as SavedTemplate[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeAll(list: SavedTemplate[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50)));
  } catch {
    /* quota */
  }
}

export function savePackageAsTemplate(toolSlug: string, pkg: CreatorPostPackage, label?: string) {
  const list = readAll();
  const entry: SavedTemplate = {
    id: crypto.randomUUID(),
    toolSlug,
    label: label?.trim() || pkg.hook.slice(0, 48) || "Saved template",
    package: pkg,
    savedAt: Date.now()
  };
  writeAll([entry, ...list]);
  return entry;
}

export function listTemplatesForTool(toolSlug: string): SavedTemplate[] {
  return readAll().filter((t) => t.toolSlug === toolSlug);
}

export function templateToShareText(t: SavedTemplate): string {
  return formatPackageAsPlainText(t.package);
}
