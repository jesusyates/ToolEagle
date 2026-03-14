type Example = { input: string; output: string };

type ExamplesCardProps = {
  title?: string;
  examples: Example[];
  onUseExample: (input: string) => void;
};

export function ExamplesCard({
  title = "Examples",
  examples,
  onUseExample
}: ExamplesCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
        {title}
      </p>
      <ul className="mt-3 space-y-3">
        {examples.map((ex, i) => (
          <li key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs">
            <p className="text-slate-500 font-medium mb-1">Input</p>
            <p className="text-slate-800 mb-2">{ex.input}</p>
            <p className="text-slate-500 font-medium mb-1">Output</p>
            <p className="text-slate-800 whitespace-pre-line mb-2">{ex.output}</p>
            <button
              type="button"
              onClick={() => onUseExample(ex.input)}
              className="text-sky-700 font-medium hover:underline"
            >
              Use this example
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
