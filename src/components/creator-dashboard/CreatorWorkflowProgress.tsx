"use client";

type Props = {
  percent: number;
  hook: boolean;
  caption: boolean;
  hashtag: boolean;
  title: boolean;
  publish: boolean;
};

function Step({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
          done ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
        }`}
      >
        {done ? "✓" : "·"}
      </span>
      <span className={done ? "font-medium text-slate-800" : "text-slate-500"}>{label}</span>
    </div>
  );
}

export function CreatorWorkflowProgress({ percent, hook, caption, hashtag, title, publish }: Props) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 px-4 py-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-900/90">Workflow</p>
        <span className="text-sm font-bold text-emerald-900">{percent}%</span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Step done={hook} label="Hook" />
        <Step done={caption} label="Caption" />
        <Step done={hashtag} label="Hashtag" />
        <Step done={title} label="Title" />
        <Step done={publish} label="Publish / upload" />
      </div>
    </div>
  );
}
