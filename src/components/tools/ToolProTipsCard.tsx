type ToolProTipsCardProps = {
  title?: string;
  tips: string[];
};

export function ToolProTipsCard({
  title = "Pro tips",
  tips
}: ToolProTipsCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5 shadow-sm">
      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
        {title}
      </p>
      <ul className="mt-2 space-y-1.5 text-[11px] text-slate-600">
        {tips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </div>
  );
}

