import { resolveV186 } from "../resolve-v186";

describe("V193 -> V186 prompt injection", () => {
  it("injects [V193 Platform Observations — additive TikTok boost] into knowledgeBlock", () => {
    const creatorAnalysisSummary = [
      "Profile: Mixed formats on tiktok — stage: growing.",
      "Stage: beginner · primary focus: growth · topic consistency: 80/100.",
      "Dominant style: Educational / calm · Focus score (conversion lean): 55/100. Readiness: medium.",
      "hooks: question 35% · curiosity 20% · list 15% · story 15% · none 15%",
      "CTA: 2/4 posts · kind soft_engagement",
      "Issues: Opening lines do not vary or stop the scroll | Content format is too scattered for the algorithm to “learn” you | CTA is missing on most posts",
      "Next types: proof | tutorial",
      "Next action: Try a structured next post",
      "Strategy: Keep hooks curiosity-driven and end with one concrete action."
    ].join("\n");

    const res = resolveV186({
      toolSlug: "hook-generator",
      intentId: "intent_views",
      scenarioId: "sc_tutorial",
      userText: "cozy desk setup for students",
      creatorAnalysisSummary
    });

    expect(res).not.toBeNull();
    if (!res) return;
    expect(res.knowledgeBlock).toContain("[V193 Platform Observations — additive TikTok boost. Apply when relevant to your generation task.]");
    expect(res.knowledgeBlock).toContain("Top TikTok observation patterns:");
    expect(res.knowledgeBlock).toContain("V193.1 Platform Difference Reinforcement");
    expect(res.knowledgeBlock).toContain("TikTok voice (must follow for hooks):");
    expect(res.v193ObservationApplied).toBe(true);
    expect(res.v193GenerationMeta?.additive_only).toBe(true);
  });
});

