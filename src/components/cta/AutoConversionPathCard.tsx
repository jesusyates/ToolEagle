import Link from "next/link";

const UPGRADE_LABELS = {
  a: "Upgrade for higher limits →",
  b: "See plans & raise limits →"
} as const;

type ToolProps = {
  toolSlug: string;
  /** V179 — stronger frame + button when revenue runtime marks high-value tools. */
  upgradeBoost?: "standard" | "max";
  upgradeCopyVariant?: "a" | "b";
  /** V180 — paywall friction trust layer (same component for core + dynamic tools). */
  trustBlock?: "none" | "compact" | "full";
};

/** V178 / V179 — Structured conversion strip for tool aside (no generator logic changes). */
export function ToolAutoConversionPathCard({
  toolSlug,
  upgradeBoost = "standard",
  upgradeCopyVariant = "a",
  trustBlock = "none"
}: ToolProps) {
  const isMax = upgradeBoost === "max";
  const upgradeLabel = UPGRADE_LABELS[upgradeCopyVariant === "b" ? "b" : "a"];

  return (
    <div
      className={
        isMax
          ? "rounded-3xl border-2 border-amber-300/95 bg-sky-50/95 p-5 text-slate-900 shadow-md ring-1 ring-amber-200/80"
          : "rounded-3xl border border-sky-200/90 bg-sky-50/95 p-5 text-slate-900 shadow-sm"
      }
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-900/90">Your publish path</p>
      <p className="mt-2 text-sm text-slate-800 leading-relaxed">
        Turn generations into posts: copy from results, paste into your app, then come back for the next
        variant.
      </p>
      {trustBlock === "compact" ? (
        <p className="mt-2 text-xs text-slate-600 leading-relaxed">
          Checkout is handled by trusted payment partners. Compare options anytime on{" "}
          <Link href="/pricing" className="font-medium text-sky-800 hover:underline">
            pricing
          </Link>
          .
        </p>
      ) : null}
      {trustBlock === "full" ? (
        <div className="mt-2 rounded-xl border border-slate-200/90 bg-white/80 px-3 py-2 text-xs text-slate-700 leading-relaxed">
          <p className="font-semibold text-slate-800">Before you upgrade</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            <li>Secure payment processing; no hidden fees on the plan page.</li>
            <li>
              Questions? Open{" "}
              <Link href="/pricing" className="font-medium text-sky-800 hover:underline">
                pricing
              </Link>{" "}
              first, then continue when ready.
            </li>
          </ul>
        </div>
      ) : null}
      <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm font-medium text-slate-800">
        <li>Generate and copy outputs in this tool</li>
        <li>Publish on your platform (TikTok, Reels, Shorts, etc.)</li>
        <li>
          <Link href={`/tools/${toolSlug}`} className="text-sky-800 hover:underline">
            Re-open this tool
          </Link>{" "}
          for more ideas
        </li>
      </ol>
      <div className="mt-4">
        <Link
          href="/pricing"
          className={
            isMax
              ? "inline-flex w-full justify-center rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-amber-500"
              : "inline-flex w-full justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          }
        >
          {upgradeLabel}
        </Link>
      </div>
    </div>
  );
}

type AnswerProps = {
  toolSlug: string;
  toolName: string;
  /** V179 — when Level-B primary upgrade card is shown, drop duplicate weak pricing line. */
  hideInlinePricing?: boolean;
};

/** V179 — Level B upgrade control near primary answer CTA (manifest-driven). */
export function AnswerUpgradePathCard() {
  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Limits & plans</p>
      <Link
        href="/pricing"
        className="mt-2 inline-flex w-full justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
      >
        {UPGRADE_LABELS.a}
      </Link>
    </div>
  );
}

/** V178 — Answer page: content → tool → copy/publish → upgrade (structured only). */
export function AnswerAutoWorkflowPathCard({
  toolSlug,
  toolName,
  hideInlinePricing
}: AnswerProps) {
  return (
    <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-slate-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900/90">Workflow</p>
      <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-sm text-slate-800">
        <li>You&apos;re on the answer (quick guidance)</li>
        <li>
          <Link href={`/tools/${toolSlug}`} className="font-medium text-sky-700 hover:underline">
            Open {toolName}
          </Link>{" "}
          to generate options
        </li>
        <li>Copy results, then publish inside your app</li>
        {!hideInlinePricing ? (
          <li>
            <Link href="/pricing" className="font-medium text-sky-700 hover:underline">
              Upgrade
            </Link>{" "}
            if you outgrow free usage
          </li>
        ) : null}
      </ol>
    </div>
  );
}
