"use client";

import { getFreshnessLabel } from "@/lib/zh-uniqueness";

type Props = {
  lang?: "zh" | "en";
};

export function ZhFreshnessBlock({ lang = "zh" }: Props) {
  const label = getFreshnessLabel();
  const text = lang === "zh" ? `最近更新：${label}` : `Last updated: ${label}`;

  return (
    <p className="text-sm text-slate-500 mt-2" data-freshness>
      {text}
    </p>
  );
}
