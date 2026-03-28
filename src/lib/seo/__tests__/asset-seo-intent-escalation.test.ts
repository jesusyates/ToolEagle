import {
  buildIntentEscalationPlan,
  classifyCurrentIntentState,
  computeNextIntentState,
  escalationPreferredTriggerType,
  escalationTimingOffset
} from "../asset-seo-intent-escalation";
import { buildIntentEscalationArtifactFromRows } from "../asset-seo-intent-escalation-summary";
import { deriveMonetizationTrigger } from "../asset-seo-monetization-trigger";
import { buildRuntimeIntentEscalationPlan } from "../asset-seo-intent-escalation-runtime";

describe("V163 classifyCurrentIntentState", () => {
  test("seo_discovery for zh low citation", () => {
    expect(
      classifyCurrentIntentState({
        lane: "zh",
        topic_key: "x",
        ai_citation_likely: 0.35,
        low_revenue_penalty: 0
      })
    ).toBe("seo_discovery");
  });

  test("generation_ready when value delivered", () => {
    expect(
      classifyCurrentIntentState({
        lane: "en",
        topic_key: "x",
        value_delivered: true,
        generation_count: 1,
        ai_citation_likely: 0.5
      })
    ).toBe("generation_ready");
  });
});

describe("V163 computeNextIntentState", () => {
  test("seo stays until ai surface", () => {
    const cur = classifyCurrentIntentState({
      lane: "zh",
      topic_key: "x",
      ai_citation_likely: 0.35,
      low_revenue_penalty: 0
    });
    expect(cur).toBe("seo_discovery");
    expect(
      computeNextIntentState(
        {
          lane: "zh",
          topic_key: "x",
          retrieval_used: true,
          ai_citation_likely: 0.35,
          low_revenue_penalty: 0
        },
        "seo_discovery"
      )
    ).toBe("ai_citation_discovery");
  });
});

describe("V163 buildIntentEscalationPlan", () => {
  test("bounded strength when transitioning", () => {
    const p = buildIntentEscalationPlan(
      {
        lane: "zh",
        topic_key: "x",
        ai_citation_likely: 0.4,
        low_revenue_penalty: 0,
        entry_source: "organic_ai_surface",
        monetization_tier: "medium"
      },
      0.5
    );
    expect(p.current_intent_state).toBe("seo_discovery");
    expect(p.next_intent_state).toBe("ai_citation_discovery");
    expect(p.escalation_strength).toBeGreaterThanOrEqual(0.2);
    expect(p.escalation_strength).toBeLessThanOrEqual(0.95);
  });

  test("stable intent yields zero strength", () => {
    const p = buildIntentEscalationPlan(
      {
        lane: "en",
        topic_key: "x",
        value_delivered: true,
        generation_count: 1,
        ai_citation_likely: 0.5
      },
      0.5
    );
    expect(p.current_intent_state).toBe(p.next_intent_state);
    expect(p.escalation_strength).toBe(0);
  });
});

describe("V163 escalation timing + trigger", () => {
  test("first use blocks timing offset", () => {
    const plan = buildIntentEscalationPlan(
      { lane: "zh", topic_key: "z", ai_citation_likely: 0.35, low_revenue_penalty: 0 },
      0.5
    );
    expect(escalationTimingOffset(plan, 1, true)).toBe(0);
  });

  test("deriveMonetizationTrigger respects escalation offset without breaking safety", () => {
    const t = deriveMonetizationTrigger({
      monetization_tier: "high",
      generation_count: 2,
      value_delivered: true,
      best_trigger_timing: 2,
      escalation: { timing_offset: 1 }
    });
    expect(t.trigger_type === "soft" || t.trigger_type === "hard").toBe(true);
  });

  test("no trigger when value not delivered even with escalation", () => {
    const t = deriveMonetizationTrigger({
      monetization_tier: "high",
      generation_count: 3,
      value_delivered: false,
      best_trigger_timing: 1,
      escalation: { timing_offset: -1 }
    });
    expect(t.trigger_type).toBe("none");
  });
});

describe("V163 artifact shape", () => {
  test("buildIntentEscalationArtifactFromRows", () => {
    const p = buildIntentEscalationPlan({ lane: "en", topic_key: "a", ai_citation_likely: 0.5 }, 0.4);
    const art = buildIntentEscalationArtifactFromRows([{ topic_key: "a", plan: p }]);
    expect(art.version).toMatch(/^v163/);
    expect(typeof art.monetization_ready_segments).toBe("number");
    expect(Array.isArray(art.escalation_paths)).toBe(true);
  });
});

describe("V163.1 runtime plan", () => {
  test("fallback builds plan", () => {
    const p = buildRuntimeIntentEscalationPlan({
      lane: "en",
      topic: "hello",
      workflow_id: "tiktok",
      monetization_tier: "medium",
      generation_index: 1,
      lifetime_generation_count: 1,
      value_delivered: false,
      retrieval_used: false,
      revenue_summary: null
    });
    expect(p.current_intent_state).toBeTruthy();
  });
});
