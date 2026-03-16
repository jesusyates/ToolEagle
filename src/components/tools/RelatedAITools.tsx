"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import {
  AI_TOOLS_MARKETPLACE,
  getAIToolsByCategory,
  type AIToolCategory
} from "@/config/ai-tools-marketplace";

type Props = {
  category?: AIToolCategory;
  limit?: number;
  excludeSlug?: string;
};

export function RelatedAITools({ category, limit = 4, excludeSlug }: Props) {
  const tools = category
    ? getAIToolsByCategory(category)
    : AI_TOOLS_MARKETPLACE.slice(0, 8);

  const filtered = tools
    .filter((t) => t.slug !== excludeSlug)
    .slice(0, limit);

  if (filtered.length === 0) return null;

  return (
    <section className="mt-10 rounded-xl border border-slate-200 bg-slate-50/50 p-6">
      <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-sky-500" />
        Related AI Tools
      </h2>
      <ul className="mt-4 space-y-2">
        {filtered.map((t) => (
          <li key={t.slug}>
            <Link
              href={t.isTooleagle && t.toolSlug ? `/tools/${t.toolSlug}` : `/ai-tools/${t.slug}`}
              className="block rounded-lg border border-slate-200 bg-white px-3 py-2 hover:border-sky-300 transition"
            >
              <span className="font-medium text-slate-800">{t.name}</span>
              {t.isTooleagle && (
                <span className="ml-2 text-xs text-sky-600">Free</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/ai-tools"
        className="mt-4 inline-block text-sm font-medium text-sky-600 hover:underline"
      >
        Browse all AI tools →
      </Link>
    </section>
  );
}
