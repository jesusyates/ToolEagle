/**
 * v60.1 - Best Guides section at TOP of EN pages
 * Links to 5-10 core pages (platform-specific) for authority consolidation
 */
import Link from "next/link";
import { getBestGuidesForPlatform } from "@/config/core-pages-en";

type BestGuidesSectionProps = {
  platform: string;
};

export function BestGuidesSection({ platform }: BestGuidesSectionProps) {
  const guides = getBestGuidesForPlatform(platform, 8);
  if (guides.length === 0) return null;

  return (
    <nav
      className="mb-8 rounded-xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-white p-5"
      aria-label="Best guides"
    >
      <p className="text-xs font-bold uppercase tracking-wider text-sky-700 mb-3">
        Best Guides
      </p>
      <p className="text-sm text-slate-600 mb-4">
        Top creator guides to grow your audience and get more views.
      </p>
      <div className="flex flex-wrap gap-2">
        {guides.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="inline-flex rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm font-medium text-sky-700 shadow-sm hover:bg-sky-50 hover:border-sky-300 hover:shadow transition"
          >
            {label} →
          </Link>
        ))}
      </div>
    </nav>
  );
}
