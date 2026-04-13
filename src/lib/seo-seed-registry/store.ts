import fs from "node:fs/promises";
import path from "node:path";
import type { AppSeoSeedRecord, AppSeoSeedStore } from "./types";
import { validateSeedRecord, validateSeedStore } from "./validate";

const DEFAULT_REL = path.join("data", "app-seo-seeds.json");

export function defaultSeedStorePath(repoRoot: string): string {
  return path.join(repoRoot, DEFAULT_REL);
}

export async function readAppSeoSeedStore(repoRoot?: string): Promise<AppSeoSeedStore> {
  const root = repoRoot ?? process.cwd();
  const p = defaultSeedStorePath(root);
  try {
    const raw = await fs.readFile(p, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    const v = validateSeedStore(parsed);
    if (!v.ok) {
      return { version: 1, updatedAt: new Date().toISOString(), seeds: [] };
    }
    return v.store;
  } catch {
    return { version: 1, updatedAt: new Date().toISOString(), seeds: [] };
  }
}

export async function writeAppSeoSeedStore(store: AppSeoSeedStore, repoRoot?: string): Promise<void> {
  const root = repoRoot ?? process.cwd();
  const p = defaultSeedStorePath(root);
  await fs.mkdir(path.dirname(p), { recursive: true });
  const out: AppSeoSeedStore = {
    ...store,
    updatedAt: new Date().toISOString()
  };
  await fs.writeFile(p, JSON.stringify(out, null, 2), "utf8");
}

export async function mergeSeedsIntoStore(
  incoming: unknown[],
  mode: "merge" | "replace",
  repoRoot?: string
): Promise<AppSeoSeedStore> {
  const normalized: AppSeoSeedRecord[] = [];
  for (let i = 0; i < incoming.length; i++) {
    const v = validateSeedRecord(incoming[i], i);
    if (!v.ok) throw new Error(v.error);
    normalized.push(v.seed);
  }

  const current = await readAppSeoSeedStore(repoRoot);
  if (mode === "replace") {
    const store: AppSeoSeedStore = {
      version: current.version,
      updatedAt: new Date().toISOString(),
      seeds: normalized
    };
    await writeAppSeoSeedStore(store, repoRoot);
    return store;
  }
  const byId = new Map<string, AppSeoSeedRecord>();
  for (const s of current.seeds) byId.set(s.id, s);
  for (const s of normalized) byId.set(s.id, s);
  const merged: AppSeoSeedStore = {
    version: current.version,
    updatedAt: new Date().toISOString(),
    seeds: [...byId.values()]
  };
  await writeAppSeoSeedStore(merged, repoRoot);
  return merged;
}
