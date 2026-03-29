/**
 * @jest-environment node
 */

import {
  buildRetrievalDatasetFromHqJson,
  normalizeTopicKey
} from "@/lib/seo/retrieval-dataset-build";
import type { WorkflowRetrievalRow } from "@/lib/seo/retrieval-dataset-schema";

describe("retrieval-dataset-build", () => {
  it("normalizeTopicKey lowercases and trims", () => {
    expect(normalizeTopicKey("  Foo Bar  ")).toBe("foo bar");
  });

  it("builds v165 document with schema fields", () => {
    const hq = [
      {
        id: "hq-a",
        topic: "TikTok Test",
        workflow: "tiktok",
        page_type: "zh_keyword",
        content_summary: "summary one",
        quality_score: 0.9,
        created_at: "2026-03-29T00:00:00.000Z",
        dedup_hash: "aaa"
      }
    ];
    const doc = buildRetrievalDatasetFromHqJson(hq, new Date("2026-03-29T12:00:00.000Z"));
    expect(doc.version).toBe("165");
    expect(doc.source).toBe("agent_high_quality_assets.json");
    expect(doc.source_asset_count).toBe(1);
    expect(doc.item_count).toBe(1);
    expect(doc.items).toHaveLength(1);
    const row = doc.items[0] as WorkflowRetrievalRow;
    expect(row.id).toBe("hq-a");
    expect(row.topic).toBe("TikTok Test");
    expect(row.normalized_topic).toBe("tiktok test");
    expect(row.workflow).toBe("tiktok");
    expect(row.page_type).toBe("zh_keyword");
    expect(row.locale).toBe("zh");
    expect(row.content_summary).toBe("summary one");
    expect(row.quality_score).toBe(0.9);
    expect(row.created_at).toBe("2026-03-29T00:00:00.000Z");
    expect(doc.buckets.by_workflow.tiktok).toEqual(["hq-a"]);
  });

  it("dedupes by dedup_hash keeping higher quality_score", () => {
    const hq = [
      {
        id: "hq-1",
        topic: "Same",
        workflow: "tiktok",
        page_type: "zh_keyword",
        content_summary: "a",
        quality_score: 0.5,
        dedup_hash: "samehash"
      },
      {
        id: "hq-2",
        topic: "Same",
        workflow: "tiktok",
        page_type: "zh_keyword",
        content_summary: "b",
        quality_score: 0.95,
        dedup_hash: "samehash"
      }
    ];
    const doc = buildRetrievalDatasetFromHqJson(hq, new Date("2026-03-29T12:00:00.000Z"));
    expect(doc.item_count).toBe(1);
    expect(doc.items[0].id).toBe("hq-2");
    expect(doc.items[0].quality_score).toBe(0.95);
  });
});
