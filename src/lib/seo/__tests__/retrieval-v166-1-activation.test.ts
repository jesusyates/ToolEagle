/**
 * @jest-environment node
 */

import fs from "fs";
import os from "os";
import path from "path";
import {
  buildRetrievalActivationArtifact,
  RETRIEVAL_ACTIVATION_ARTIFACT_VERSION,
  writeRetrievalActivationArtifact
} from "@/lib/seo/retrieval-activation-artifact";

const v153Path = path.join(process.cwd(), "scripts", "lib", "seo-retrieval-v153.js");
const v153 = require(v153Path) as {
  evaluateRetrievalForKeyword: (ctx: { keyword: string; platform?: string; goal?: string }) => {
    sufficient: boolean;
    topScore: number | null;
    activationPassUsed?: boolean;
    hits: Array<{ score: number; topic: string; workflow_id?: string; matchMeta?: { base: number; expanded: number } }>;
  };
  scoreSubstringOverlap: (a: string, b: string) => number;
  scoreCjkOverlap: (a: string, b: string) => number;
  scoreGoalOverlap: (goal: string, text: string) => number;
  scoreAssetFull: (
    ctx: {
      queryTokens: string[];
      normCompact: string;
      keywordNorm: string;
      goal: string;
      platform: string;
    },
    a: { topic: string; body: string; workflow_id: string },
    lane: string
  ) => { score: number; expanded: number; base: number };
  buildQueryContext: (k: string, p: string, g: string) => {
    queryTokens: string[];
    normCompact: string;
    keywordNorm: string;
    goal: string;
    platform: string;
  };
};

describe("V166.1 retrieval matching + activation", () => {
  it("substring overlap rewards shared long phrase (normalized)", () => {
    const a = "tiktok变现3天实现方法";
    const b = "tiktok变现3天实现方法的核心";
    expect(v153.scoreSubstringOverlap(a, b)).toBeGreaterThan(0.35);
  });

  it("CJK overlap requires at least 3 shared characters", () => {
    expect(v153.scoreCjkOverlap("短视频引流涨粉", "引流与涨粉的短视频策略")).toBeGreaterThan(0.1);
    expect(v153.scoreCjkOverlap("甲乙", "丙丁")).toBe(0);
  });

  it("goal anchor is bounded and zero when goal missing in corpus", () => {
    expect(v153.scoreGoalOverlap("变现", "快速变现路径")).toBeGreaterThan(0.1);
    expect(v153.scoreGoalOverlap("变现", "只做内容不做转化")).toBe(0);
  });

  it("same-workflow row gets expanded score for TikTok-style keyword vs dataset topic", () => {
    const ctx = v153.buildQueryContext("TikTok变现3天实现方法", "tiktok", "变现");
    const row = {
      topic: "TikTok变现3天实现方法",
      body: "3天变现的核心是快速验证。",
      workflow_id: "tiktok"
    };
    const r = v153.scoreAssetFull(ctx, row, "workflow_assets");
    expect(r.expanded).toBeGreaterThan(0.2);
    expect(r.score).toBeGreaterThan(0.25);
  });

  it("does not inflate score via CJK when platform mismatches on workflow lane", () => {
    const ctx = v153.buildQueryContext("小红书运营技巧", "instagram", "涨粉");
    const row = {
      topic: "TikTok私域引流快速实现方法",
      body: "私域引流说明",
      workflow_id: "tiktok"
    };
    const r = v153.scoreAssetFull(ctx, row, "workflow_assets");
    expect(r.expanded).toBe(0);
    expect(r.score).toBeLessThan(0.2);
  });

  it("evaluateRetrievalForKeyword exposes activationPassUsed boolean", () => {
    const ev = v153.evaluateRetrievalForKeyword({
      keyword: "TikTok变现3天实现方法",
      platform: "tiktok",
      goal: "变现"
    });
    expect(ev.hits.length).toBeGreaterThan(0);
    expect(typeof ev.activationPassUsed).toBe("boolean");
  });
});

describe("seo-retrieval-activation artifact", () => {
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "retrieval-act-"));
    const gen = path.join(tmp, "generated");
    fs.mkdirSync(gen, { recursive: true });
    fs.writeFileSync(
      path.join(gen, "workflow-assets-retrieval.json"),
      JSON.stringify(
        {
          version: "165",
          item_count: 3,
          items: [
            {
              id: "a",
              topic: "TikTok",
              normalized_topic: "tiktok",
              workflow: "tiktok",
              page_type: "zh_keyword",
              locale: "zh",
              content_summary: "x",
              quality_score: 0.9,
              created_at: "2026-01-01T00:00:00.000Z"
            },
            {
              id: "b",
              topic: "YouTube",
              normalized_topic: "youtube",
              workflow: "youtube",
              page_type: "zh_keyword",
              locale: "zh",
              content_summary: "x",
              quality_score: 0.9,
              created_at: "2026-01-01T00:00:00.000Z"
            },
            {
              id: "c",
              topic: "Instagram",
              normalized_topic: "instagram",
              workflow: "instagram",
              page_type: "zh_keyword",
              locale: "zh",
              content_summary: "x",
              quality_score: 0.9,
              created_at: "2026-01-01T00:00:00.000Z"
            }
          ],
          buckets: {
            by_workflow: { tiktok: ["a"], youtube: ["b"], instagram: ["c"] },
            by_locale: { zh: ["a", "b", "c"] },
            by_page_type: { zh_keyword: ["a", "b", "c"] }
          }
        },
        null,
        2
      ),
      "utf8"
    );
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("artifact has required shape and version", () => {
    const art = buildRetrievalActivationArtifact(tmp, new Date("2026-03-29T12:00:00.000Z"));
    expect(art.version).toBe(RETRIEVAL_ACTIVATION_ARTIFACT_VERSION);
    expect(art).toHaveProperty("dataset_ready");
    expect(art).toHaveProperty("workflow_bucket_coverage");
    expect(art).toHaveProperty("topic_matchability_summary");
    expect(art).toHaveProperty("retrieval_activation_ready");
    expect(Array.isArray(art.top_blockers)).toBe(true);
    expect(Array.isArray(art.notes)).toBe(true);
    expect(art.workflow_bucket_coverage.tiktok).toBe(1);
    const out = writeRetrievalActivationArtifact(tmp, new Date("2026-03-29T12:00:00.000Z"));
    const disk = JSON.parse(fs.readFileSync(path.join(tmp, "generated", "seo-retrieval-activation.json"), "utf8"));
    expect(disk.version).toBe(RETRIEVAL_ACTIVATION_ARTIFACT_VERSION);
    expect(disk.dataset_ready).toBe(out.dataset_ready);
  });
});
