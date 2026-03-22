"use client";

/**
 * V85: Return Visit Loop - after email submit or tool use
 * "Come back tomorrow for new ideas" + "Latest guides" + "More tools"
 */

import Link from "next/link";

type Props = {
  /** Context: email_success | tool_used */
  context?: "email_success" | "tool_used";
  /** Optional next recommended page */
  nextPage?: { href: string; label: string };
};

export function ZhReturnVisitBlock({ context = "email_success", nextPage }: Props) {
  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5" aria-label="下次再来">
      <h3 className="text-sm font-semibold text-slate-900">明天再来，获取新灵感</h3>
      <p className="mt-1 text-xs text-slate-600">
        Come back tomorrow for new ideas · Latest guides · More tools
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href="/zh/sitemap" className="text-sm text-sky-600 hover:text-sky-800 hover:underline">
          最新指南
        </Link>
        <span className="text-slate-400">·</span>
        <Link href="/zh/tools/title-generator" className="text-sm text-sky-600 hover:text-sky-800 hover:underline">
          更多工具
        </Link>
        {nextPage && (
          <>
            <span className="text-slate-400">·</span>
            <Link href={nextPage.href} className="text-sm font-medium text-sky-600 hover:text-sky-800 hover:underline">
              {nextPage.label} →
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
