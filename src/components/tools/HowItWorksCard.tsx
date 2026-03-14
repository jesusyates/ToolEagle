type Step = { step: number; text: string };

type HowItWorksCardProps = {
  steps: Step[];
};

export function HowItWorksCard({ steps }: HowItWorksCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6 shadow-sm">
      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
        How it works
      </p>
      <ol className="mt-3 space-y-3">
        {steps.map(({ step, text }) => (
          <li key={step} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
              {step}
            </span>
            <span className="text-sm text-slate-700 pt-0.5">{text}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
