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
      className="group block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200">
            <Icon className="h-5 w-5 text-slate-700" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500">{category}</p>
            <h3 className="text-base font-semibold text-slate-900 leading-snug">
              {name}
            </h3>
          </div>
        </div>

        <span className="text-xs font-medium text-sky-700 bg-sky-50 border border-sky-100 px-2 py-1 rounded-full">
          Open
        </span>
      </div>

      <p className="mt-2 text-sm text-slate-600 leading-relaxed">
        {description}
      </p>
    </Link>
  );
}

