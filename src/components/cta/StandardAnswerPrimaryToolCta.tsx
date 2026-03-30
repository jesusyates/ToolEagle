import Link from "next/link";
import { Sparkles } from "lucide-react";

type Props = {
  toolSlug: string;
  toolName: string;
  /** V178 — stronger visual when manifest marks high-conversion emphasis. */
  emphasize?: boolean;
};

function toolHref(toolSlug: string): string {
  const s = toolSlug.trim();
  if (s.startsWith("/tools/")) return s;
  const bare = s.replace(/^\//, "");
  return `/tools/${bare}`;
}

/** V171.2 — Answer page: primary tool entry above the fold. */
export function StandardAnswerPrimaryToolCta({ toolSlug, toolName, emphasize }: Props) {
  const href = toolHref(toolSlug);
  return (
    <div
      className={
        emphasize
          ? "mt-4 rounded-2xl border-2 border-sky-400 bg-sky-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm"
          : "mt-4 rounded-2xl border border-sky-200 bg-sky-50/90 px-4 py-3 flex flex-wrap items-center justify-between gap-3"
      }
    >
      <div className="flex items-center gap-2 text-sm text-sky-950">
        <Sparkles className="h-4 w-4 shrink-0 text-sky-600" aria-hidden />
        <span>
          <span className="font-semibold">Try it:</span> {toolName}
        </span>
      </div>
      <Link
        href={href}
        className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Open tool →
      </Link>
    </div>
  );
}
