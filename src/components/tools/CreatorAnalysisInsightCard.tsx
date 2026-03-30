"use client";

import type { CreatorAnalysisOutput } from "@/lib/creator-analysis/types";

type Props = {
  output: CreatorAnalysisOutput;
};

export function CreatorAnalysisInsightCard({ output }: Props) {
  const issues = output.content_issues?.slice(0, 3) ?? [];
  const shortSummary = output.next_content_recommendations?.slice(0, 3) ?? [];

  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Creator analysis</p>
      <p className="mt-1 text-xs text-slate-600">
        We analyze your content to guide your next move.
        <br />
        Run an analysis to unlock personalized recommendations.
      </p>

      {issues.length > 0 ? (
        <div className="mt-3">
          <p className="text-xs font-semibold text-slate-900">Primary issues</p>
          <ol className="mt-2 space-y-2 text-xs text-slate-800">
            {issues.map((i) => (
              <li key={i.id} className="flex flex-col gap-0.5">
                <span className="font-medium">{i.title}</span>
                {i.detail ? <span className="text-[11px] text-slate-600">{i.detail}</span> : null}
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {shortSummary.length > 0 ? (
        <div className="mt-3">
          <p className="text-xs font-semibold text-slate-900">Short summary</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-800">
            {shortSummary.map((s, idx) => (
              <li key={`${idx}-${s.slice(0, 12)}`}>{s}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

