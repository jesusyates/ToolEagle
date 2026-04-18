import fs from "node:fs/promises";
import path from "node:path";

const FILE = path.join("generated", "seo-recycle-retry-state.json");

export type RecycleRetryStateFile = {
  /** Article ids that have already consumed their single `needs_rewrite` recycle attempt. */
  articleIdsRetried: string[];
};

export async function readRecycleRetryState(repoRoot: string): Promise<Set<string>> {
  const p = path.join(repoRoot, FILE);
  try {
    const raw = await fs.readFile(p, "utf8");
    const j = JSON.parse(raw) as RecycleRetryStateFile;
    return new Set((j.articleIdsRetried || []).filter(Boolean));
  } catch {
    return new Set();
  }
}

export async function recordRecycleRetryConsumed(repoRoot: string, articleId: string): Promise<void> {
  const id = String(articleId || "").trim();
  if (!id) return;
  const p = path.join(repoRoot, FILE);
  let existing: string[] = [];
  try {
    const raw = await fs.readFile(p, "utf8");
    const j = JSON.parse(raw) as RecycleRetryStateFile;
    existing = [...(j.articleIdsRetried || [])];
  } catch {
    existing = [];
  }
  if (!existing.includes(id)) existing.push(id);
  const out: RecycleRetryStateFile = { articleIdsRetried: existing };
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, `${JSON.stringify(out, null, 2)}\n`, "utf8");
}
