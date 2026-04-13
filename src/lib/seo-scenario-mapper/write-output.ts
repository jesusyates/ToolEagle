import fs from "node:fs/promises";
import path from "node:path";
import type { ScenarioMappedTopic, SeoScenarioTopicsFile } from "./types";

const OUT_REL = path.join("generated", "seo-scenario-topics.json");

export function scenarioTopicsPath(repoRoot: string): string {
  return path.join(repoRoot, OUT_REL);
}

export async function writeScenarioTopicsJson(topics: ScenarioMappedTopic[], repoRoot?: string): Promise<SeoScenarioTopicsFile> {
  const root = repoRoot ?? process.cwd();
  const p = scenarioTopicsPath(root);
  const doc: SeoScenarioTopicsFile = {
    version: 1,
    updatedAt: new Date().toISOString(),
    topicCount: topics.length,
    topics
  };
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(doc, null, 2), "utf8");
  return doc;
}
