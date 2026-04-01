import type { CreatorState } from "@/lib/content/creator-state";
import { buildCreatorStateStrategy } from "@/lib/content/creator-state-strategy";
import { buildCreatorStateToolContext } from "@/lib/content/creator-state-tool-context";
import { scoreCreatorStateToolContext } from "@/lib/content/creator-state-tool-weight";
import { classifyCreatorStateToolWeight } from "@/lib/content/creator-state-tool-band";

export function buildCreatorStatePromptBlock(
  state: CreatorState,
  score: { applyScore: number; level: "weak" | "medium" | "strong" },
  source: "fresh" | "cached",
  toolSlug: string
): { mode: "minimal" | "standard" | "full"; block: string } {
  const level = score.level;
  const mode = level === "weak" ? "minimal" : level === "medium" ? "standard" : "full";
  if (mode === "minimal") {
    const a1 = state.actions[0] ?? "Complete one real upload after generation.";
    return {
      mode,
      block: [
        "[Creator state]",
        `Stage: ${state.stage}`,
        `Priority: ${state.priority}`,
        `Current focus: ${state.focus}`,
        `Next action: ${a1}`,
        `Apply score: ${score.applyScore} (${score.level})`
      ].join("\n")
    };
  }
  if (mode === "standard") {
    const strat = buildCreatorStateStrategy(state);
    const ctx = buildCreatorStateToolContext(toolSlug, strat);
    const weighted = scoreCreatorStateToolContext(ctx.toolType, ctx.contextLines);
    const toolBand = classifyCreatorStateToolWeight(weighted.weightScore);
    return {
      mode,
      block: [
        "[Creator state]",
        `Stage: ${state.stage}`,
        `Priority: ${state.priority}`,
        `Source: ${source}`,
        `Current focus: ${state.focus}`,
        "",
        "Core problems:",
        ...state.problems.slice(0, 2).map((p, i) => `${i + 1}. ${p}`),
        "",
        "Next actions:",
        ...state.actions.slice(0, 2).map((a, i) => `${i + 1}. ${a}`),
        "",
        "Tool context:",
        ...weighted.rankedLines.map((l) => `* ${l}`),
        `Tool context band: ${toolBand.band}`,
        `Apply score: ${score.applyScore} (${score.level})`
      ].join("\n")
    };
  }
  const strat = buildCreatorStateStrategy(state);
  const ctx = buildCreatorStateToolContext(toolSlug, strat);
  const weighted = scoreCreatorStateToolContext(ctx.toolType, ctx.contextLines);
  const toolBand = classifyCreatorStateToolWeight(weighted.weightScore);
  return {
    mode,
    block: [
      "[Creator state]",
      `Stage: ${state.stage}`,
      `Priority: ${state.priority}`,
      `Source: ${source}`,
      `Current focus: ${state.focus}`,
      `Apply score: ${score.applyScore} (${score.level})`,
      "",
      "Core problems:",
      ...state.problems.slice(0, 3).map((p, i) => `${i + 1}. ${p}`),
      "",
      "Next actions:",
      ...state.actions.slice(0, 3).map((a, i) => `${i + 1}. ${a}`),
      "",
      "Tool context:",
      ...weighted.rankedLines.map((l) => `* ${l}`),
      `Tool context band: ${toolBand.band}`,
      "",
      `Summary: ${state.summary}`
    ].join("\n")
  };
}

