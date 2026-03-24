"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getEnToolJourney } from "@/config/en-tool-journey";

type Props = {
  toolSlug: string;
  /** Show after user has at least one result */
  hasOutput: boolean;
};

/**
 * V109.5 — Unified “next step” strip after results (EN global tools).
 */
export function ToolNextSteps({ toolSlug, hasOutput }: Props) {
  if (!hasOutput) return null;
  const j = getEnToolJourney(toolSlug);
  if (!j || j.nextSteps.length === 0) return null;

  return (
    <div
      className="mt-6 rounded-2xl border border-sky-200/80 bg-sky-950/40 px-4 py-4 text-slate-100"
      role="region"
      aria-label="Next steps"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-300/95">Next steps</p>
      <ul className="mt-3 space-y-2">
        {j.nextSteps.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href}
              className="group flex items-center justify-between gap-2 rounded-xl border border-slate-600/80 bg-slate-900/60 px-3 py-2.5 text-sm font-medium text-white hover:border-sky-500/60 hover:bg-slate-800/80 transition"
            >
              <span>{s.label}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-sky-400 group-hover:translate-x-0.5 transition" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
