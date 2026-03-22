"use client";

/**
 * V91: Aggressive distribution pack UI — top 5 money pages × 10 Reddit / X / Quora (Injection Priority)
 */

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ZhCopyButton } from "@/components/zh/ZhCopyButton";

type PackItem = {
  id: string;
  label: string;
  body: string;
};

type PackPage = {
  slug: string;
  pageType: string;
  title: string;
  pageUrl: string;
  tag: string;
  reddit: PackItem[];
  x: PackItem[];
  quora: PackItem[];
};

export function InjectionPriorityPackBlock() {
  const t = useTranslations("distributionDashboard");
  const locale = useLocale();
  const [pack, setPack] = useState<PackPage[]>([]);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [tab, setTab] = useState<"reddit" | "x" | "quora">("reddit");

  useEffect(() => {
    const loc = locale === "en" ? "en" : "zh";
    fetch(`/api/traffic-injection/pack?locale=${loc}`)
      .then((r) => r.json())
      .then((d) => setPack(d.pack ?? []))
      .catch(() => setPack([]));
  }, [locale]);

  if (pack.length === 0) return null;

  return (
    <div className="rounded-xl border-2 border-rose-200 bg-rose-50/60 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold text-slate-900">Aggressive distribution pack</h3>
        <span className="rounded-full bg-rose-200 px-2.5 py-0.5 text-xs font-bold text-rose-900">
          Injection Priority
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        Top 5 money pages — 10 Reddit posts, 10 X threads, 10 Quora answers each. Copy and post.
      </p>

      <div className="mt-4 space-y-3">
        {pack.map((page) => {
          const isOpen = openSlug === page.slug;
          const items = page[tab] ?? [];
          return (
            <div key={page.slug} className="rounded-lg border border-rose-200 bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenSlug(isOpen ? null : page.slug)}
                className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-rose-50/80"
              >
                <span className="font-medium text-slate-900 line-clamp-1">{page.title}</span>
                <span className="text-xs text-rose-700 shrink-0">{isOpen ? "▲" : "▼"}</span>
              </button>
              {isOpen && (
                <div className="border-t border-rose-100 px-4 py-3 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {(["reddit", "x", "quora"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setTab(p)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                          tab === p ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {p === "reddit" &&
                          t("tabReddit", { count: page.reddit?.length ?? 0 })}
                        {p === "x" && t("tabX", { count: page.x?.length ?? 0 })}
                        {p === "quora" &&
                          t("tabQuora", { count: page.quora?.length ?? 0 })}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    <a href={page.pageUrl} className="text-sky-600 hover:underline" target="_blank" rel="noreferrer">
                      {t("openPage")}
                    </a>
                  </p>
                  <ul className="space-y-3 max-h-[420px] overflow-y-auto">
                    {items.map((it) => (
                      <li
                        key={it.id}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-semibold text-rose-800">{it.label}</span>
                          <ZhCopyButton text={it.body} label={t("copyButton")} className="shrink-0" />
                        </div>
                        <pre className="whitespace-pre-wrap break-words text-[11px] leading-relaxed max-h-32 overflow-y-auto">
                          {it.body.slice(0, 500)}
                          {it.body.length > 500 ? "…" : ""}
                        </pre>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
