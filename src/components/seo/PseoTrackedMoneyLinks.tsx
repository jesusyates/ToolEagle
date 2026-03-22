"use client";

import Link from "next/link";
import { useCallback } from "react";
import type { PseoLocale } from "@/lib/programmatic-seo";
import { PSEO_MONEY_PAGE_TARGETS } from "@/lib/programmatic-seo";

type Props = {
  sourcePage: string;
  locale: PseoLocale;
  variant: "above-fold" | "mid" | "bottom";
};

export function PseoTrackedMoneyLinks({ sourcePage, locale, variant }: Props) {
  const onNavigate = useCallback(
    async (targetHref: string, toolSlug?: string) => {
      try {
        await fetch("/api/traffic/pseo-click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourcePage,
            targetPage: targetHref,
            locale,
            tool: toolSlug ?? null,
            variant
          })
        });
      } catch {
        /* non-blocking */
      }
    },
    [sourcePage, locale, variant]
  );

  const title =
    variant === "above-fold"
      ? "Start with top free AI tools"
      : variant === "mid"
        ? "Try these revenue-ready generators"
        : "Best free AI tools on ToolEagle";

  return (
    <div
      className={
        variant === "above-fold"
          ? "mt-6 rounded-2xl border-2 border-sky-400 bg-gradient-to-br from-sky-50 to-white p-5 shadow-sm"
          : variant === "mid"
            ? "my-10 rounded-2xl border border-amber-200 bg-amber-50/80 p-5"
            : "mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6"
      }
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {PSEO_MONEY_PAGE_TARGETS.map((t) => (
          <li key={t.href}>
            <Link
              href={t.href}
              className="inline-flex rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
              onClick={() => void onNavigate(t.href, t.toolSlug)}
            >
              {t.label} →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
