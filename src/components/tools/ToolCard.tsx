import Link from "next/link";

export function ToolCard({
  href,
  icon: Icon,
  name,
  description,
  category
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  description: string;
  category: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40"
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200">
          <Icon className="h-5 w-5 text-slate-700" />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {category}
          </p>
          <h3 className="text-base font-semibold text-slate-900 leading-snug">
            {name}
          </h3>
        </div>
      </div>

      <p className="mt-2 text-sm text-slate-600 leading-relaxed">
        {description}
      </p>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-slate-500">Open the tool to start creating</span>
        <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white group-hover:bg-slate-800">
          Open tool
        </span>
      </div>
    </Link>
  );
}

