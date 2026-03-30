import Link from "next/link";
import { getToolCardBody } from "@/lib/tool-display";
import type { ToolConfig } from "@/config/tools";
import { formatUsageCountLabel, getToolUsageCountForDisplay } from "@/config/tool-usage-display";

type Props = {
  tool: ToolConfig;
  href: string;
  /** When omitted, reads optional `generated/tool-usage-display.json` — otherwise shows "—". */
  usageCount?: number | null;
  badge?: "Popular" | "Trending";
};

/**
 * V171.1 — Single standard card for English tool directory / hub listings (fixed layout, equal height).
 */
export function EnglishToolEntryCard({ tool, href, usageCount: usageProp, badge }: Props) {
  const usageCount =
    usageProp !== undefined ? usageProp : getToolUsageCountForDisplay(tool.slug);
  const body = getToolCardBody("en", tool.slug, tool.description, tool.descriptionZh);
  const Icon = tool.icon;

  return (
    <Link
      href={href}
      className="group flex h-full min-h-[220px] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-150 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100">
          <Icon className="h-5 w-5 text-slate-700" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{tool.category}</p>
            {badge && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  badge === "Popular" ? "bg-amber-100 text-amber-800" : "bg-sky-100 text-sky-800"
                }`}
              >
                {badge}
              </span>
            )}
          </div>
          <h3 className="text-base font-semibold leading-snug text-slate-900">{tool.name}</h3>
        </div>
      </div>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600 line-clamp-3">{body}</p>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span className="font-medium text-slate-500">Usage</span>
        <span className="tabular-nums font-semibold text-slate-700">
          {formatUsageCountLabel(usageCount)}
        </span>
      </div>

      <div className="mt-3">
        <span className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-3 py-2.5 text-center text-sm font-semibold text-white group-hover:bg-slate-800">
          Open tool
        </span>
      </div>
    </Link>
  );
}
