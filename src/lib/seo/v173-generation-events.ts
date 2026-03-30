/**
 * V173 — Append-only JSONL for generate-package / blog / ops aggregation.
 */

import fs from "fs";
import path from "path";

export type V173GenerationEvent = {
  ts: string;
  source: "generate_package" | "blog_seo" | "daily_engine";
  outcome:
    | "success"
    | "pregen_block"
    | "dedup_block"
    | "strict_503"
    | "strict_gate_salvage"
    | "relaxed_once_still_failed"
    | "router_error"
    | "router_error_salvage"
    | "blog_reject"
    | "blog_skip_v172_pregen"
    | "blog_skip_v172_dedup"
    | "daily_engine_summary";
  route?: string;
  topic_fp?: string;
  topic_preview?: string;
  http_status?: number;
  package_count?: number;
  retrieval_used?: boolean;
  tier?: string;
  strict_effective?: boolean;
  relaxed_once?: boolean;
  /** True when strict user was salvaged via one-time relaxed path */
  via_relaxed_salvage?: boolean;
  /** Package included heuristic / pad fill */
  heuristic_fill?: boolean;
  error_code?: string;
  message?: string;
};

const LOG_NAME = "v173-generation-events.jsonl";

export function v173EventsPath(cwd: string = process.cwd()): string {
  return path.join(cwd, "logs", LOG_NAME);
}

export function v173AppendGenerationEvent(
  partial: Omit<V173GenerationEvent, "ts"> & { ts?: string },
  cwd: string = process.cwd()
): void {
  try {
    const dir = path.join(cwd, "logs");
    fs.mkdirSync(dir, { recursive: true });
    const row: V173GenerationEvent = {
      ts: partial.ts ?? new Date().toISOString(),
      ...partial
    } as V173GenerationEvent;
    fs.appendFileSync(v173EventsPath(cwd), JSON.stringify(row) + "\n", "utf8");
  } catch {
    /* non-fatal */
  }
}
