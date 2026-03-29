/**
 * @jest-environment node
 */

import fs from "fs";
import os from "os";
import path from "path";
import { runSeoStatus } from "@/lib/seo/seo-status-core";

describe("seo-status-core", () => {
  let tmp: string;
  let gen: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "seo-status-"));
    gen = path.join(tmp, "generated");
    fs.mkdirSync(gen, { recursive: true });
    const recent = new Date(Date.now() - 3600000).toISOString();
    fs.writeFileSync(
      path.join(gen, "seo-run-heartbeat.json"),
      JSON.stringify({ last_run_at: recent, success: true }, null, 2),
      "utf8"
    );
    fs.writeFileSync(path.join(gen, "seo-alerts.json"), JSON.stringify({ alerts: [] }, null, 2), "utf8");
    fs.writeFileSync(
      path.join(gen, "agent_high_quality_assets.json"),
      JSON.stringify(
        [
          {
            id: "hq-1",
            topic: "Test Topic",
            workflow: "tiktok",
            page_type: "zh_keyword",
            content_summary: "Test summary for retrieval.",
            quality_score: 0.9,
            created_at: "2026-03-29T00:00:00.000Z",
            dedup_hash: "testdedup1"
          }
        ],
        null,
        2
      ),
      "utf8"
    );
    fs.writeFileSync(
      path.join(gen, "workflow-assets-retrieval.json"),
      JSON.stringify({ items: [{ x: 1 }] }, null, 2),
      "utf8"
    );
    fs.writeFileSync(
      path.join(gen, "seo-retrieval-stats.json"),
      JSON.stringify(
        { retrieval_count: 2, ai_generation_count: 8, retrieval_share: 0.2 },
        null,
        2
      ),
      "utf8"
    );
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("includes flywheel line and writes seo-flywheel-ramp.json", () => {
    const { lines, flywheel } = runSeoStatus(tmp, new Date("2026-03-29T15:00:00.000Z"));
    const joined = lines.join("\n");
    expect(joined).toContain("Retrieval dataset — built: yes");
    expect(joined).toContain("Retrieval utilization —");
    expect(joined).toMatch(/eligible:\s*(yes|no)/);
    expect(joined).toContain("Retrieval activation — ready:");
    expect(joined).toContain("workflow_coverage:");
    expect(fs.existsSync(path.join(gen, "seo-retrieval-activation.json"))).toBe(true);
    expect(joined).toContain("Flywheel — HQ assets:");
    expect(joined).toMatch(/state:\s*\w+/);
    expect(flywheel.current_high_quality_asset_count).toBe(1);
    expect(flywheel.current_retrieval_dataset_count).toBe(1);
    const rampPath = path.join(gen, "seo-flywheel-ramp.json");
    expect(fs.existsSync(rampPath)).toBe(true);
    const disk = JSON.parse(fs.readFileSync(rampPath, "utf8"));
    expect(disk.flywheel_state).toBeDefined();
    expect(disk.retrieval_share).toBeGreaterThanOrEqual(0);
    expect(disk.retrieval_dataset_threshold).toBeGreaterThanOrEqual(1);
    expect(disk).toHaveProperty("retrieval_dataset_last_built_at");
    expect(disk).toHaveProperty("retrieval_hits_window");
    expect(disk).toHaveProperty("fallback_top_reason");
    expect(fs.existsSync(path.join(gen, "seo-retrieval-utilization.json"))).toBe(true);
  });
});
