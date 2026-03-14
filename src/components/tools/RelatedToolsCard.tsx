import Link from "next/link";
import { tools } from "@/config/tools";

type RelatedToolsCardProps = {
  currentSlug: string;
  category: string;
  limit?: number;
};

export function RelatedToolsCard({
  currentSlug,
  category,
  limit = 3
}: RelatedToolsCardProps) {
  const related = tools
    .filter((t) => t.slug !== currentSlug && t.category === category)
    .slice(0, limit);

  if (related.length === 0) return null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6 shadow-sm">
      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
        Related tools
      </p>
      <ul className="mt-3 space-y-2">
        {related.map((tool) => (
          <li key={tool.slug}>
            <Link
              href={`/tools/${tool.slug}`}
              className="text-sm text-slate-700 hover:text-sky-700 hover:underline transition duration-150"
            >
              {tool.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
