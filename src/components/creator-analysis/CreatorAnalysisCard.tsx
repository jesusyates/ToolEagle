"use client";

import type { CreatorAnalysisOutput } from "@/lib/creator-analysis/types";

type Props = {
  output: CreatorAnalysisOutput;
  className?: string;
};

function stageLabel(s: CreatorAnalysisOutput["creator_stage"] | undefined): string {
  switch (s) {
    case "beginner":
      return "Beginner";
    case "growing":
      return "Growing";
    case "monetizing":
      return "Monetizing";
    default:
      return "Growing";
  }
}

/**
 * V191 — Compact summary: account type, stage, 3 issues, 3 suggestions, next action.
 */
export function CreatorAnalysisCard({ output, className = "" }: Props) {
  const types = (output.next_content_types?.length ? output.next_content_types : output.next_content_recommendations).slice(0, 3);
  const issuesRaw = output.content_issues?.length
    ? output.content_issues
    : output.top_weaknesses.map((t, i) => ({ id: `legacy-${i}`, title: t, detail: "" }));
  const issues = issuesRaw.slice(0, 3);
  const focus = output.primary_focus ?? (output.account_focus_score >= 52 ? "conversion" : "growth");
  const stage = output.creator_stage ?? "growing";
  const cta = output.cta_usage ?? {
    posts_with_cta: 0,
    posts_without_cta: 0,
    coverage: output._signals?.cta_coverage ?? 0,
    dominant_cta_kind: "none" as const
  };
  const tcs = output.topic_consistency_score ?? Math.round(100 * (1 - (output._signals?.niche_entropy ?? 0.5)));

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-900/90">Account type</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{output.creator_profile}</p>
        <p className="mt-1 text-xs text-slate-600">
          Dominant read: {output.dominant_style}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Stage & focus</p>
        <p className="mt-1 text-sm text-slate-900">
          <span className="font-semibold">{stageLabel(stage)}</span>
          <span className="text-slate-400"> · </span>
          <span>{focus === "growth" ? "Optimize for reach" : "Optimize for conversion"}</span>
          <span className="text-slate-400"> · </span>
          <span className="text-slate-600">Readiness {output.monetization_readiness}</span>
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Topic consistency {tcs}/100 · CTA on {cta.posts_with_cta}/{cta.posts_with_cta + cta.posts_without_cta} posts
        </p>
      </div>

      <div className="rounded-2xl border border-red-100 bg-red-50/40 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-red-900/80">3 issues</p>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-slate-800">
          {issues.map((i) => (
            <li key={i.id}>
              <span className="font-medium">{i.title}</span>
              <span className="block text-xs font-normal text-slate-600">{i.detail}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-900/80">3 content suggestions</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-800">
          {types.map((t, idx) => (
            <li key={idx}>{t}</li>
          ))}
        </ol>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Recommended next step</p>
        <p className="mt-1 text-sm font-medium text-slate-900">
          {output.next_best_action ?? types[0] ?? "Add one structured post with a clear hook and one CTA."}
        </p>
        <p className="mt-2 text-xs text-slate-600">{output.short_strategy ?? output.next_best_strategy}</p>
      </div>
    </div>
  );
}
