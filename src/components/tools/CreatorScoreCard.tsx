"use client";

import { useMemo } from "react";
import { loadCreatorMemory } from "@/lib/creator-guidance/creator-memory-store";
import { computeCreatorScore } from "@/lib/creator-guidance/compute-creator-score";
import { useCreatorMemoryRevision } from "@/lib/creator-guidance/use-creator-memory-revision";

type Props = {
  toolSlug: string;
  variant?: "full" | "compact";
  locale?: string;
};

/**
 * V189 — Visible creator progress from real behavior (V187 memory), not vanity points.
 */
export function CreatorScoreCard({ toolSlug, variant = "full", locale = "en" }: Props) {
  const zhUi = locale.startsWith("zh");

  const tick = useCreatorMemoryRevision();
  const s = useMemo(() => computeCreatorScore(loadCreatorMemory(), toolSlug), [toolSlug, tick]);

  if (zhUi) return null;

  if (variant === "compact") {
    return (
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-[11px] text-slate-700">
        <span className="font-bold text-slate-900">
          Creator score: {s.score}/100 · {s.bandLabel}
        </span>
        <span className="text-slate-600">Stage: {s.stage.title}</span>
        <span className="text-slate-500">Workflow {s.workflowCompletionPercent}%</span>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/95 to-white px-4 py-3 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-900/90">Creator progress</p>
      <div className="mt-1 flex flex-wrap items-baseline gap-2">
        <p className="text-lg font-bold text-slate-900">
          {s.score} / 100 <span className="text-sm font-semibold text-slate-600">({s.bandLabel})</span>
        </p>
      </div>
      <p className="mt-1 text-sm font-semibold text-slate-800">Stage: {s.stage.title}</p>
      <p className="mt-0.5 text-[11px] text-slate-600">{s.stage.summary}</p>
      <p className="mt-1 text-xs text-slate-600">{s.whyOneLine}</p>
      <p className="mt-2 text-xs font-medium text-amber-950">
        Next best move: <span className="text-slate-900">{s.nextBestActionLabel}</span>
      </p>
      <p className="mt-2 text-[10px] text-slate-500">
        Workflow completion: {s.workflowCompletionPercent}% (hook · caption · hashtag · title · upload once)
      </p>
    </div>
  );
}
