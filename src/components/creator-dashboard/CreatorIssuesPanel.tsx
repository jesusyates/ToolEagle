"use client";

type Props = {
  issues: Array<{ title: string; detail: string }>;
};

export function CreatorIssuesPanel({ issues }: Props) {
  if (!issues.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Issues</p>
        <p className="mt-2 text-sm text-slate-600">
          We analyze your content to guide your next move.
          <br />
          Run an analysis to unlock personalized recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-red-100 bg-red-50/50 px-4 py-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-red-900/80">Issues</p>
      <ol className="mt-3 space-y-3">
        {issues.slice(0, 3).map((i, idx) => (
          <li
            key={idx}
            className={
              idx === 0
                ? "rounded-xl border-l-4 border-amber-500 bg-amber-50/80 pl-3 pr-2 py-2.5"
                : "rounded-lg border border-red-100/80 bg-white/60 pl-3 pr-2 py-2"
            }
          >
            <div className="flex flex-wrap items-center gap-2">
              {idx === 0 ? (
                <span className="rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Primary
                </span>
              ) : (
                <span className="text-xs font-medium text-slate-400">{idx + 1}.</span>
              )}
              <span className="font-semibold text-slate-900">{i.title}</span>
            </div>
            {i.detail ? <p className="mt-1 text-xs leading-relaxed text-slate-600">{i.detail}</p> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
