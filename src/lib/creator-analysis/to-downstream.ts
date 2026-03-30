/**
 * V191 — Feed analysis into V186/V187/V189/V190 via memory + prompt summary.
 */

import type { CreatorAnalysisOutput } from "@/lib/creator-analysis/types";
import { extractTopKeywords } from "@/lib/creator-analysis/niche-cluster";
import { mergeV191AnalysisIntoMemory } from "@/lib/creator-guidance/creator-memory-store";

/** Compact block for resolveV186 / generate-package (keep under ~900 chars). */
export function buildCreatorAnalysisSummaryForPrompt(output: CreatorAnalysisOutput, niche: string): string {
  const mix = output.content_mix;
  const mixLine = `mix: tutorial ${mix.tutorial}% · story ${mix.storytelling}% · sell ${mix.selling}% · list ${mix.listicle}% · opinion ${mix.opinion}%`;
  const hooks = output.hook_distribution;
  const hookLine = hooks
    ? `hooks: question ${hooks.question}% · curiosity ${hooks.curiosity}% · list ${hooks.list}% · story ${hooks.story}% · none ${hooks.none}%`
    : "";
  const cta = output.cta_usage;
  const ctaLine = cta
    ? `CTA: ${cta.posts_with_cta}/${cta.posts_with_cta + cta.posts_without_cta} posts · kind ${cta.dominant_cta_kind}`
    : "";
  const issues = output.content_issues?.length
    ? output.content_issues.map((i) => i.title).join(" | ")
    : output.top_weaknesses.join(" | ");
  return [
    "[V191 Account analysis — honor when generating; do not invent metrics.]",
    `Profile: ${output.creator_profile}`,
    `Stage: ${output.creator_stage} · primary focus: ${output.primary_focus} · topic consistency: ${output.topic_consistency_score}/100.`,
    `Dominant style: ${output.dominant_style}. Focus score (conversion lean): ${output.account_focus_score}/100. Readiness: ${output.monetization_readiness}.`,
    mixLine,
    hookLine,
    ctaLine,
    `Strengths: ${output.top_strengths.join(" | ")}`,
    `Issues: ${issues}`,
    `Next types: ${output.next_content_types.join(" | ")}`,
    `Next action: ${output.next_best_action}`,
    `Strategy: ${output.short_strategy || output.next_best_strategy}`,
    `Niche keywords: ${extractTopKeywords(niche, 8).join(", ")}`
  ]
    .filter(Boolean)
    .join("\n");
}

/** Merge analysis keywords into V187 memory for V189/V190 (client-only). */
export function applyCreatorAnalysisToMemory(output: CreatorAnalysisOutput, nicheBlob: string): void {
  const kw = extractTopKeywords(nicheBlob, 12);
  const hint =
    output.content_mix.tutorial + output.content_mix.listicle >= output.content_mix.storytelling
      ? "tutorial"
      : output.content_mix.storytelling > 22
        ? "story"
        : null;
  mergeV191AnalysisIntoMemory({
    nicheKeywords: kw,
    preferredContentTypeHint: hint
  });
}
