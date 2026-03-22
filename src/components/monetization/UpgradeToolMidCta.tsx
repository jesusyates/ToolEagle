"use client";

import { UpgradeLink } from "@/components/monetization/UpgradeLink";

/**
 * V94: Mid-page upgrade strip on tool flows — "Save hours with AI" angle.
 */
export function UpgradeToolMidCta() {
  return (
    <div className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 to-indigo-50/80 px-4 py-4 sm:px-5">
      <p className="text-sm font-semibold text-slate-900">Save hours with AI</p>
      <p className="mt-1 text-xs text-slate-600">
        Free = compact packages. Pro = <strong>full</strong> post packages — more variants, deeper strategy blocks, not just higher limits.
      </p>
      <UpgradeLink className="mt-3 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
        Grow faster — Upgrade to Pro →
      </UpgradeLink>
    </div>
  );
}
