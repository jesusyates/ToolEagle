import fs from "fs";
import path from "path";
import Link from "next/link";
import { toolsForEnglishSite, type ToolConfig } from "@/config/tools";

type RelatedToolsCardProps = {
  currentSlug: string;
  category: string;
  limit?: number;
  /** V178 — winner-cluster slugs first, deduped with category-ranked picks. */
  extraSlugs?: string[];
};

function loadConversionRank(currentSlug: string): Map<string, number> {
  const m = new Map<string, number>();
  try {
    const p = path.join(process.cwd(), "generated", "internal-link-priority-report.json");
    if (!fs.existsSync(p)) return m;
    const j = JSON.parse(fs.readFileSync(p, "utf8")) as {
      byToolSlug?: Record<string, { targetSlug: string; score: number }[]>;
    };
    const rows = j.byToolSlug?.[currentSlug] ?? [];
    rows.forEach((r, i) => m.set(r.targetSlug, r.score * 1000 - i));
  } catch {
    /* optional V171 artifact */
  }
  return m;
}

export function RelatedToolsCard({
  currentSlug,
  category,
  limit = 3,
  extraSlugs = []
}: RelatedToolsCardProps) {
  const rank = loadConversionRank(currentSlug);
  const effectiveLimit = extraSlugs.length > 0 ? Math.max(limit, 5) : limit;

  const extraTools = extraSlugs
    .map((s) => toolsForEnglishSite.find((t) => t.slug === s))
    .filter((x): x is ToolConfig => x != null && x.slug !== currentSlug);

  const pool = toolsForEnglishSite.filter((t) => t.slug !== currentSlug && t.category === category);
  let ranked: ToolConfig[] = [...pool].sort(
    (a, b) => (rank.get(b.slug) ?? 0) - (rank.get(a.slug) ?? 0)
  );

  if (ranked.length === 0 && rank.size > 0) {
    ranked = [...rank.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([slug]) => toolsForEnglishSite.find((x) => x.slug === slug))
      .filter((x): x is ToolConfig => x != null && x.slug !== currentSlug);
  }

  const seen = new Set<string>();
  const related: ToolConfig[] = [];
  for (const t of [...extraTools, ...ranked]) {
    if (seen.has(t.slug)) continue;
    seen.add(t.slug);
    related.push(t);
    if (related.length >= effectiveLimit) break;
  }

  if (related.length === 0) return null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6 shadow-sm">
      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
        Related tools (workflow-first)
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
