import Link from "next/link";
import { tools } from "@/config/tools";
import { Zap } from "lucide-react";

const POPULAR_FOR_SEO = ["tiktok-caption-generator", "hook-generator", "hashtag-generator"] as const;

export function SeoToolLinks() {
  const popularTools = POPULAR_FOR_SEO.map((slug) => tools.find((t) => t.slug === slug)).filter(Boolean);

  return (
    <nav className="mt-10 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-3">
        Popular Tools
      </p>
      <div className="flex flex-wrap gap-2">
        {popularTools.map((tool) => {
          if (!tool) return null;
          const Icon = tool.icon ?? Zap;
          return (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 transition"
            >
              <Icon className="h-4 w-4 text-sky-600" />
              {tool.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
