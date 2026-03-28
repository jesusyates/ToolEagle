import {
  aggregateMonetizationEvents,
  computeTimingPerformance,
  computeVariantPerformance
} from "../asset-seo-monetization-aggregation";
import {
  selectBestTriggerTiming,
  selectTopicSpecificTriggerStrategy,
  selectWinningVariant,
  selectWorkflowSpecificTriggerStrategy
} from "../asset-seo-monetization-decision";

describe("V153 monetization aggregation", () => {
  const rows = [
    { event_name: "upgrade_shown", variant_id: "v1", topic: "comedy hooks", workflow_id: "tiktok_post_v1" },
    { event_name: "upgrade_clicked", variant_id: "v1", topic: "comedy hooks", workflow_id: "tiktok_post_v1" },
    {
      event_name: "upgrade_converted",
      variant_id: "v1",
      topic: "comedy hooks",
      workflow_id: "tiktok_post_v1",
      generation_count_before_conversion: 2,
      revenue: 30
    },
    { event_name: "upgrade_shown", variant_id: "v2", topic: "fitness hooks", workflow_id: "instagram_post_v1" },
    { event_name: "upgrade_clicked", variant_id: "v2", topic: "fitness hooks", workflow_id: "instagram_post_v1" }
  ] as const;

  test("computes variant/timing performance", () => {
    const v = computeVariantPerformance(rows as any);
    const t = computeTimingPerformance(rows as any);
    expect(v[0].variant_id).toBe("v1");
    expect(v[0].conversion_rate).toBeGreaterThan(0);
    expect([1, 2, 3]).toContain(t[0].timing);
  });

  test("aggregates global winner and timing", () => {
    const agg = aggregateMonetizationEvents(rows as any);
    expect(agg.global_winner_variant).toBe("v1");
    expect([1, 2, 3]).toContain(agg.global_best_timing);
    expect(agg.topics.length).toBeGreaterThan(0);
    expect(agg.workflows.length).toBeGreaterThan(0);
    expect(Array.isArray(agg.page_types)).toBe(true);
  });
});

describe("V153 decision fallbacks and overrides", () => {
  test("falls back when sparse", () => {
    const s = selectWinningVariant({ intelligence: null, topic: "x", workflow_id: "w", min_samples: 10 });
    expect(s.source).toBe("fallback");
    expect(s.variant_id).toBe("v1");
    expect(s.best_trigger_timing).toBe(2);
  });

  test("selects global winner when enough data", () => {
    const agg = aggregateMonetizationEvents(
      new Array(12).fill(0).map(() => ({ event_name: "upgrade_shown", variant_id: "v3", workflow_id: "tiktok_post_v1" }))
    );
    const s = selectWinningVariant({ intelligence: agg, workflow_id: "unknown", topic: "unknown", min_samples: 10 });
    expect(["global", "workflow", "topic"]).toContain(s.source);
    expect(typeof s.variant_id).toBe("string");
  });

  test("selects topic/workflow strategy and timing", () => {
    const rows = [];
    for (let i = 0; i < 15; i++) {
      rows.push({ event_name: "upgrade_shown", variant_id: "v1", topic: "topic-a", workflow_id: "wf-a" });
    }
    const agg = aggregateMonetizationEvents(rows as any);
    const st = selectTopicSpecificTriggerStrategy({ intelligence: agg, topic: "topic-a", min_samples: 10 });
    const sw = selectWorkflowSpecificTriggerStrategy({ intelligence: agg, workflow_id: "wf-a", min_samples: 10 });
    const bt = selectBestTriggerTiming({ intelligence: agg, topic: "topic-a", workflow_id: "wf-a", min_samples: 10 });
    expect(["topic", "workflow", "global"]).toContain(st.source);
    expect(["workflow", "global", "topic"]).toContain(sw.source);
    expect([1, 2, 3]).toContain(bt);
  });
});

