import { resolveV186 } from "../resolve-v186";

describe("V191.2 Analysis-to-generation reinforcement", () => {
  it("injects issue/style/focus directives into effectiveUserInput and returns analysisHint", () => {
    const creatorAnalysisSummary = [
      "Profile: Mixed formats on tiktok — stage: growing.",
      "Stage: beginner · primary focus: growth · topic consistency: 80/100.",
      "Dominant style: Conversational / friendly · Educational / calm. Focus score (conversion lean): 55/100. Readiness: medium.",
      "mix: tutorial 40% · story 25% · sell 10% · list 15% · opinion 10%",
      "hooks: question 35% · curiosity 20% · list 15% · story 15% · none 15%",
      "CTA: 2/4 posts · kind soft_engagement",
      "Strengths: strong patterns",
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

    // analysisHint must show we applied analysis.
    expect(res.analysisHint).toContain("Applied from your analysis:");

    // effectiveUserInput should include at least one directive from the issue map.
    expect(res.effectiveUserInput).toContain("Hook fix: prefer curiosity/interrupt/question opening patterns");

    // knowledgeBlock should include the V191.2 directive marker when directives exist.
    expect(res.knowledgeBlock).toContain("[V191.2 Analysis-to-generation reinforcement — apply these directives before writing.]");
  });
});

