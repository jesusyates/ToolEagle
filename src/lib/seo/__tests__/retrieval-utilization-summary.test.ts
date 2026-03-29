/**
 * @jest-environment node
 */

import fs from "fs";
import os from "os";
import path from "path";
import {
  buildSeoRetrievalUtilizationPayload,
  readRetrievalTelemetryRows
} from "@/lib/seo/retrieval-utilization-summary";

describe("retrieval-utilization-summary", () => {
  let tmp: string;
  let gen: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ret-util-"));
    gen = path.join(tmp, "generated");
    fs.mkdirSync(gen, { recursive: true });
    const lines = [
      JSON.stringify({
        event: "retrieval_hit_recorded",
        keyword: "kw1",
        platform: "tiktok"
      }),
      JSON.stringify({
        event: "retrieval_fallback_reason_recorded",
        keyword: "kw2",
        platform: "tiktok",
        reason: "no_qualified_hits"
      })
    ];
    fs.writeFileSync(path.join(gen, "seo-retrieval-events.jsonl"), lines.join("\n") + "\n", "utf8");
    fs.writeFileSync(
      path.join(gen, "seo-retrieval-stats.json"),
      JSON.stringify({ retrieval_count: 1, ai_generation_count: 9, retrieval_share: 0.1 }),
      "utf8"
    );
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("buildSeoRetrievalUtilizationPayload matches artifact shape", () => {
    const rows = readRetrievalTelemetryRows(tmp);
    const p = buildSeoRetrievalUtilizationPayload(tmp, rows, new Date("2026-03-29T12:00:00.000Z"));
    expect(p.version).toBe("166");
    expect(p.retrieval_hits).toBe(1);
    expect(p.retrieval_fallbacks).toBe(1);
    expect(p.workflow_retrieval_performance.length).toBeGreaterThanOrEqual(1);
    expect(p.production_retrieval_count).toBe(1);
    expect(p.production_ai_count).toBe(9);
    expect(typeof p.notes).toBe("string");
  });
});
