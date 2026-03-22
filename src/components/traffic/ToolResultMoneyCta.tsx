"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Summary = {
  primary: { title: string; href: string } | null;
};

/** After tool generation — Next step to make money */
export function ToolResultMoneyCta() {
  const [data, setData] = useState<Summary | null>(null);

  useEffect(() => {
    fetch("/api/traffic-injection/summary?locale=en", { credentials: "same-origin" })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  useEffect(() => {
    const href = data?.primary?.href;
    if (!href) return;
    fetch("/api/analytics/traffic-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        source: "injection",
        page: href.startsWith("/") ? href : `/${href}`,
        meta: { surface: "tool_result_money_cta" }
      })
    }).catch(() => {});
  }, [data?.primary?.href]);

  if (!data?.primary) return null;
  const href = data.primary.href.startsWith("http")
    ? new URL(data.primary.href).pathname + new URL(data.primary.href).search
    : data.primary.href;

  return (
    <div className="mb-4 rounded-2xl border-2 border-violet-300 bg-gradient-to-r from-violet-50 to-fuchsia-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-violet-800">Traffic injection</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">👉 Next step to make money</p>
      <p className="mt-1 text-xs text-slate-600">
        Top-performing guide readers are clicking right now.
      </p>
      <Link
        href={href}
        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
      >
        {data.primary.title} →
      </Link>
    </div>
  );
}
