export type GenerationPolicy = {
  policyMode: "safe_growth" | "growth" | "monetization_ready";
  policyRules: string[];
  policyBlock: string;
};

export function buildGenerationPolicy(input: {
  stage: string;
  uploadCount7d: number;
}): GenerationPolicy {
  let policyMode: GenerationPolicy["policyMode"];

  if (input.stage === "beginner" || input.uploadCount7d < 2) {
    policyMode = "safe_growth";
  } else if (input.stage === "growing") {
    policyMode = "growth";
  } else {
    policyMode = "monetization_ready";
  }

  let policyRules: string[];

  if (policyMode === "safe_growth") {
    policyRules = [
      "Focus on value-first content.",
      "Avoid any sales or promotion.",
      "Keep output simple and clear."
    ];
  } else if (policyMode === "growth") {
    policyRules = [
      "Use consistent structure in every post.",
      "Keep captions concise and readable.",
      "Maintain a clear hook at the start."
    ];
  } else {
    policyRules = [
      "Lead with value before any CTA.",
      "Use trust-building tone.",
      "Keep CTA soft and natural."
    ];
  }

  const policyBlock = `[Generation policy]
Policy mode: ${policyMode}
Rules:

${policyRules.map(r => `* ${r}`).join("\n")}
`;

  return {
    policyMode,
    policyRules,
    policyBlock
  };
}
