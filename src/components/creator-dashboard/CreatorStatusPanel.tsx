"use client";

type Props = {
  score: number;
  bandLabel: string;
  stageTitle: string;
};

/** V189 — score + band + stage only */
export function CreatorStatusPanel({ score, bandLabel, stageTitle }: Props) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/95 to-white px-4 py-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-900/90">Creator score</p>
      <div className="mt-2 flex flex-wrap items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900">{score}</span>
        <span className="text-sm font-semibold text-slate-600">/ 100 · {bandLabel}</span>
      </div>
      <p className="mt-1 text-sm font-medium text-slate-800">{stageTitle}</p>
    </div>
  );
}
