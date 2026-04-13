"use client";

import type { PublishReadinessResult } from "@/lib/seo/publish-readiness";

export function PublishReadinessPanel({ result }: { result: PublishReadinessResult }) {
  const label =
    result.level === "ready"
      ? "可以发布"
      : result.level === "review"
        ? "建议修改后再发布"
        : "暂不可发布";

  const bar =
    result.level === "block"
      ? "bg-red-100 text-red-950 border-red-200"
      : result.level === "review"
        ? "bg-amber-50 text-amber-950 border-amber-200"
        : "bg-green-50 text-green-950 border-green-200";

  return (
    <section className={`mt-6 rounded border p-4 text-sm ${bar}`}>
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="font-semibold">SEO 发布就绪度</h2>
        <span className="text-xs opacity-90">得分：{result.score}/100</span>
        <span className="font-medium">{label}</span>
      </div>
      {result.level === "block" && result.blockReasons.length > 0 ? (
        <p className="mt-2 text-xs">
          阻塞项：{result.blockReasons.join(" · ")}
        </p>
      ) : null}
      <ul className="mt-3 space-y-1 border-t border-black/10 pt-3 text-slate-900">
        {result.checks.map((c) => (
          <li key={c.id} className="flex gap-2">
            <span className="w-14 shrink-0 font-mono text-xs uppercase">
              {c.status === "pass" ? "通过" : c.status === "warn" ? "注意" : "未过"}
            </span>
            <span>
              <strong>{c.label}</strong>
              {c.detail ? <span className="text-slate-700"> — {c.detail}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
