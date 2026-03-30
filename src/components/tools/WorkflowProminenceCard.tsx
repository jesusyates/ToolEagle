import fs from "fs";
import path from "path";
import Link from "next/link";
import { tools } from "@/config/tools";

type Props = {
  toolSlug: string;
  /** V178 — merged from generated manifest; deduped by href with report-driven steps. */
  mergeExtraSteps?: { href: string; label: string }[];
  /** V179 — when primary publish-path card is max-boost, downgrade duplicate upgrade link noise. */
  upgradeLinkMode?: "default" | "subtle";
  /** V180 — hide footer pricing link when paywall runtime removes duplicate CTA. */
  hidePricingLink?: boolean;
};

/**
 * V171 — High-intent tool aside: workflow hub + conversion-weighted next tools + pricing path.
 */
function dedupeSteps(
  base: { href: string; label: string }[],
  extra?: { href: string; label: string }[]
): { href: string; label: string }[] {
  const seen = new Set<string>();
  const out: { href: string; label: string }[] = [];
  for (const row of [...(extra || []), ...base]) {
    if (seen.has(row.href)) continue;
    seen.add(row.href);
    out.push(row);
  }
  return out.slice(0, 6);
}

export function WorkflowProminenceCard({
  toolSlug,
  mergeExtraSteps,
  upgradeLinkMode = "default",
  hidePricingLink = false
}: Props) {
  const tool = tools.find((t) => t.slug === toolSlug);
  if (!tool || tool.cnOnly) return null;

  const hub =
    toolSlug.includes("youtube") || toolSlug.includes("shorts-title")
      ? { href: "/youtube-tools", label: "YouTube workflow hub (start here)" }
      : toolSlug.includes("instagram") || toolSlug.includes("reel")
        ? { href: "/instagram-tools", label: "Instagram workflow hub (start here)" }
        : { href: "/tiktok-tools", label: "TikTok workflow hub (start here)" };

  const steps: { href: string; label: string }[] = [];
  try {
    const p = path.join(process.cwd(), "generated", "internal-link-priority-report.json");
    if (fs.existsSync(p)) {
      const j = JSON.parse(fs.readFileSync(p, "utf8")) as {
        byToolSlug?: Record<string, { href: string; targetSlug: string }[]>;
      };
      const rows = j.byToolSlug?.[toolSlug] ?? [];
      for (const r of rows.slice(0, 3)) {
        const name = tools.find((t) => t.slug === r.targetSlug)?.name ?? r.targetSlug;
        steps.push({ href: r.href, label: name });
      }
    }
  } catch {
    /* optional artifact */
  }

  const mergedSteps = dedupeSteps(steps, mergeExtraSteps);

  return (
    <div className="rounded-3xl border border-amber-200/90 bg-amber-50/95 p-5 text-slate-900 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/90">
        Continue the package
      </p>
      <p className="mt-2 text-sm text-slate-800 leading-relaxed">
        Step through hook → caption → tags, then turn this into a full publish-ready workflow.
      </p>
      <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm font-medium text-slate-800">
        <li>
          <Link href={hub.href} className="text-sky-800 hover:underline">
            {hub.label}
          </Link>
        </li>
        {mergedSteps.map((s) => (
          <li key={s.href}>
            <Link href={s.href} className="text-sky-800 hover:underline">
              Next: {s.label}
            </Link>
          </li>
        ))}
      </ol>
      {!hidePricingLink ? (
        <Link
          href="/pricing"
          className={
            upgradeLinkMode === "subtle"
              ? "mt-3 inline-flex text-xs font-medium text-amber-900/80 hover:underline"
              : "mt-4 inline-flex text-sm font-semibold text-amber-950 hover:underline"
          }
        >
          Upgrade limits when you post daily →
        </Link>
      ) : null}
    </div>
  );
}
