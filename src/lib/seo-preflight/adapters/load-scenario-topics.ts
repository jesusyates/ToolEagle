import fs from "node:fs/promises";
import path from "node:path";

/** Strings from generated/seo-scenario-topics.json for preflight candidateSeeds. */
export async function loadScenarioTopicStrings(repoRoot?: string): Promise<string[]> {
  const root = repoRoot ?? process.cwd();
  const p = path.join(root, "generated", "seo-scenario-topics.json");
  try {
    const raw = await fs.readFile(p, "utf8");
    const j = JSON.parse(raw) as { topics?: unknown };
    if (!Array.isArray(j.topics)) return [];
    const out: string[] = [];
    for (const row of j.topics) {
      if (row && typeof row === "object" && typeof (row as { topic?: unknown }).topic === "string") {
        const t = (row as { topic: string }).topic.trim();
        if (t) out.push(t);
      }
    }
    return out;
  } catch {
    return [];
  }
}
