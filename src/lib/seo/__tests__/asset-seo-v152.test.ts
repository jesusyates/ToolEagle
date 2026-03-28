import { MONETIZATION_VARIANTS, pickVariantDeterministic, variantsForTrigger } from "../asset-seo-monetization-variants";
import { computeMonetizationOptimization } from "../asset-seo-monetization-optimization";
import { deriveMonetizationTrigger } from "../asset-seo-monetization-trigger";

describe("V152 monetization variants", () => {
  test("variant list exists for soft/hard triggers", () => {
    expect(MONETIZATION_VARIANTS.length).toBeGreaterThanOrEqual(4);
    expect(variantsForTrigger("soft").length).toBeGreaterThan(0);
    expect(variantsForTrigger("hard").length).toBeGreaterThan(0);
  });

  test("deterministic variant assignment by seed", () => {
    const a = pickVariantDeterministic("session-1", "soft");
    const b = pickVariantDeterministic("session-1", "soft");
    expect(a.id).toBe(b.id);
  });
});

describe("V152 optimization aggregation", () => {
  test("computes CTR/CVR/revenue and winner", () => {
    const out = computeMonetizationOptimization([
      { variant_id: "v1", shown: 100, clicked: 20, converted: 8, revenue: 80, topic: "comedy hooks", generation_count_before_conversion: 2 },
      { variant_id: "v2", shown: 100, clicked: 25, converted: 5, revenue: 50, topic: "fitness hooks", generation_count_before_conversion: 3 }
    ]);
    expect(out.variants.length).toBe(2);
    expect(out.winning_variant).toBe("v1");
    expect([1, 2, 3]).toContain(out.best_trigger_timing);
    expect(out.top_monetizing_topics[0].topic).toBe("comedy hooks");
  });
});

describe("V152 trigger timing feedback", () => {
  test("best timing influences hard trigger threshold", () => {
    const t = deriveMonetizationTrigger({
      monetization_tier: "high",
      generation_count: 2,
      value_delivered: true,
      best_trigger_timing: 2
    });
    expect(t.trigger_type).toBe("hard");
  });
});

