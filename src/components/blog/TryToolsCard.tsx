import Link from "next/link";
import { tools } from "@/config/tools";

type TryToolsCardProps = {
  toolSlugs: string[];
};

export function TryToolsCard({ toolSlugs }: TryToolsCardProps) {
  const recommended = toolSlugs
    .map((slug) => tools.find((t) => t.slug === slug))
    .filter(Boolean);

  if (recommended.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm hover:shadow-md transition duration-150">
      <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
        Try the tools
      </p>
      <ul className="mt-3 space-y-3">
        {recommended.map((tool) => (
          <li key={tool!.slug}>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {tool!.name}
              </h3>
              <p className="mt-0.5 text-sm text-slate-600">
                {tool!.description}
              </p>
              <Link
                href={`/tools/${tool!.slug}`}
                className="mt-2 inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 transition duration-150"
              >
                Open tool
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
