import type { CreatorAnalysisInput, CreatorAnalysisOutput } from "@/lib/creator-analysis/types";

const KEY = "te_v191_creator_analysis";

export type StoredCreatorAnalysis = {
  version: 1 | 2;
  savedAt: number;
  input: CreatorAnalysisInput;
  output: CreatorAnalysisOutput;
};

function migrateLegacyOutput(o: Partial<CreatorAnalysisOutput>): CreatorAnalysisOutput {
  const issues = o.content_issues?.length
    ? o.content_issues
    : (o.top_weaknesses ?? []).map((t, i) => ({ id: `m${i}`, title: t, detail: t }));
  const hooks = o.hook_distribution ?? {
    question: 0,
    fear: 0,
    curiosity: 0,
    list: 0,
    story: 0,
    command: 0,
    none: 0
  };
  const cta = o.cta_usage ?? {
    posts_with_cta: 0,
    posts_without_cta: 0,
    coverage: o._signals?.cta_coverage ?? 0,
    dominant_cta_kind: "none" as CreatorAnalysisOutput["cta_usage"]["dominant_cta_kind"]
  };
  const nextTypes = o.next_content_types?.length ? o.next_content_types : o.next_content_recommendations ?? [];
  const tcs =
    o.topic_consistency_score ??
    Math.round(Math.max(0, Math.min(100, 100 * (1 - (o._signals?.niche_entropy ?? 0.5)))));
  const stage = o.creator_stage ?? "growing";
  const focus: CreatorAnalysisOutput["primary_focus"] =
    o.primary_focus ?? (typeof o.account_focus_score === "number" && o.account_focus_score >= 52 ? "conversion" : "growth");

  return {
    creator_profile: o.creator_profile ?? "",
    content_mix: o.content_mix!,
    dominant_style: o.dominant_style ?? "",
    hook_distribution: hooks,
    cta_usage: cta,
    topic_consistency_score: tcs,
    creator_stage: stage,
    primary_focus: focus,
    account_focus_score: o.account_focus_score ?? 0,
    monetization_readiness: o.monetization_readiness ?? "medium",
    top_strengths: o.top_strengths ?? [],
    top_weaknesses: o.top_weaknesses ?? issues.map((i) => i.title),
    content_issues: issues.slice(0, 5),
    next_content_types: nextTypes,
    next_best_action: o.next_best_action ?? nextTypes[0] ?? "",
    short_strategy: o.short_strategy ?? o.next_best_strategy ?? "",
    next_content_recommendations: o.next_content_recommendations ?? nextTypes,
    next_best_strategy: o.next_best_strategy ?? o.short_strategy ?? "",
    _signals: o._signals
  };
}

export function saveCreatorAnalysis(input: CreatorAnalysisInput, output: CreatorAnalysisOutput): void {
  if (typeof window === "undefined") return;
  try {
    const payload: StoredCreatorAnalysis = { version: 2, savedAt: Date.now(), input, output };
    localStorage.setItem(KEY, JSON.stringify(payload));
    window.dispatchEvent(new Event("te_v191_analysis_updated"));
  } catch {
    /* quota */
  }
}

export function loadCreatorAnalysis(): StoredCreatorAnalysis | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<StoredCreatorAnalysis>;
    if ((p.version !== 1 && p.version !== 2) || !p.output || !p.input) return null;
    const outPartial = p.output as Partial<CreatorAnalysisOutput>;
    if (!outPartial.content_mix) return null;
    const output = migrateLegacyOutput(outPartial);
    return { version: 2, savedAt: p.savedAt ?? Date.now(), input: p.input as CreatorAnalysisInput, output };
  } catch {
    return null;
  }
}

export function clearCreatorAnalysis(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event("te_v191_analysis_updated"));
  } catch {
    /* ignore */
  }
}
