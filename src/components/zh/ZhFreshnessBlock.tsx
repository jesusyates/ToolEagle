"use client";

import { getFreshnessLabel } from "@/lib/zh-uniqueness";

export function ZhFreshnessBlock() {
  const label = getFreshnessLabel();
  return (
    <p className="text-sm text-slate-500 mt-2" data-freshness>
      最近更新：{label}
    </p>
  );
}
