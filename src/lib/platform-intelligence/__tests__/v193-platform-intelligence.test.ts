import { resolvePlatformPatterns } from "../resolve-patterns";

describe("V193 Platform Data Engine (Phase 1) integration", () => {
  it("adds v193-tk-* patterns into TikTok selection", () => {
    const ranked = resolvePlatformPatterns({
      platform: "tiktok",
      intentId: "intent_views",
      scenarioId: "sc_tutorial",
      toolType: "hook_focus",
      userProfile: { primaryGoal: "views", monetizationMode: "affiliate" }
    });

    // Ensure at least one observation-driven pattern exists.
    const anyV193 = ranked.some((r) => String(r.pattern.id).startsWith("v193-tk-"));
    expect(anyV193).toBe(true);
  });
});

