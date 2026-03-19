"use client";

import Link from "next/link";
import { TOP_RESULTS_SHOWCASE } from "@/config/top-results-showcase";

/**
 * V72: Top Results Showcase - 5 generated examples, clickable → tool
 */
export function TopResultsShowcase() {
  return (
    <section className="container py-12 border-t border-slate-200">
      <h2 className="text-lg font-semibold text-slate-900">Top generated results</h2>
      <p className="mt-1 text-sm text-slate-600">
        Real examples from creators. Click to try the tool.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOP_RESULTS_SHOWCASE.slice(0, 5).map((item, i) => (
          <Link
            key={i}
            href={`/tools/${item.toolSlug}`}
            className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-sky-300 hover:shadow-md transition"
          >
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              {item.toolName}
            </p>
            <p className="mt-2 line-clamp-3 text-sm text-slate-800 whitespace-pre-line">
              {item.result}
            </p>
            <span className="mt-2 inline-block text-xs font-medium text-sky-600 hover:text-sky-700">
              Try {item.toolName} →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
