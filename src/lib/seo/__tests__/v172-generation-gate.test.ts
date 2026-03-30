/**
 * @jest-environment node
 */

import fs from "fs";
import os from "os";
import path from "path";
import {
  buildRetrievalReferenceBlock,
  evaluatePregenGate,
  checkContentDedup,
  isV172StrictMode
} from "@/lib/seo/v172-generation-gate";

describe("v172-generation-gate", () => {
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "v172-gate-"));
    fs.mkdirSync(path.join(tmp, "generated"), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("evaluatePregenGate allows when no signals file", () => {
    const r = evaluatePregenGate("coffee shop tiktok captions", { toolSlug: "tiktok-caption-generator" }, tmp);
    expect(r.allowed).toBe(true);
    expect(r.reason).toBe("no_signals_file");
  });

  it("isV172StrictMode false without signals", () => {
    expect(isV172StrictMode(tmp)).toBe(false);
  });

  it("isV172StrictMode true when generation_strict signals exist", () => {
    fs.writeFileSync(
      path.join(tmp, "generated", "high-quality-signals.json"),
      JSON.stringify({
        version: "172",
        generation_strict: true,
        min_pregen_score: 0.08,
        reference_snippets: [],
        topic_demote: []
      }),
      "utf8"
    );
    expect(isV172StrictMode(tmp)).toBe(true);
  });

  it("buildRetrievalReferenceBlock uses workflow fallback when signals empty", () => {
    fs.writeFileSync(
      path.join(tmp, "generated", "workflow-assets-retrieval.json"),
      JSON.stringify({
        items: [
          {
            normalized_topic: "coffee",
            workflow: "tiktok",
            content_summary: "High-CTR caption patterns for cafe creators.",
            quality_score: 0.9
          }
        ]
      }),
      "utf8"
    );
    const { block, snippetCount } = buildRetrievalReferenceBlock("coffee morning routine", "en", tmp);
    expect(snippetCount).toBe(1);
    expect(block).toContain("REFERENCE_SNIPPETS");
    expect(block.toLowerCase()).toContain("coffee");
  });

  it("checkContentDedup blocks near-duplicate titles in blog mode", () => {
    fs.writeFileSync(
      path.join(tmp, "generated", "content-deduplication.json"),
      JSON.stringify({
        titles: [
          {
            slug: "tiktok-captions-coffee",
            title: "30 TikTok Captions for Coffee Creators",
            normalized: "30 tiktok captions for coffee creators"
          }
        ],
        title_similarity_threshold_blog: 0.55
      }),
      "utf8"
    );
    const hit = checkContentDedup("tiktok captions for coffee creators", tmp, "blog");
    expect(hit.blocked).toBe(true);
    expect(hit.similarSlug).toBe("tiktok-captions-coffee");
  });
});
