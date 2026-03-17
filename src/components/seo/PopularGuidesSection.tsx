/**
 * v60.1 - Popular Guides section at BOTTOM of EN pages
 * Same 10 links site-wide for authority consolidation
 */
import Link from "next/link";
import { getPopularGuides } from "@/config/core-pages-en";

export function PopularGuidesSection() {
  const guides = getPopularGuides(10);
  if (guides.length === 0) return null;

  return (
    <section className="mt-12 rounded-xl border border-slate-200 bg-slate-50/50 p-6">
      <h2 className="text-lg font-semibold text-slate-900">Popular Guides</h2>
      <p className="mt-1 text-sm text-slate-600 mb-4">
        Most-read creator guides on ToolEagle.
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {guides.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              className="text-sm font-medium text-sky-700 hover:text-sky-800 hover:underline"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
