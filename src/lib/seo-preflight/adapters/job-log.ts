import fs from "node:fs/promises";
import path from "node:path";
import type { SeoPreflightJobResult } from "../types/preflight";

export async function writePreflightJobLog(result: SeoPreflightJobResult, repoRoot?: string): Promise<string> {
  const root = repoRoot ?? process.cwd();
  const filePath = path.join(root, "generated", "seo-preflight-last-run.json");
  await fs.writeFile(filePath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  return filePath;
}
