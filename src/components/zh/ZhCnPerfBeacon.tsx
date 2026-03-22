"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * V99 — Lightweight CN route timing (console / log aggregation friendly).
 * Does not add third-party scripts.
 */
export function ZhCnPerfBeacon() {
  const pathname = usePathname() || "";

  useEffect(() => {
    if (!pathname.startsWith("/zh")) return;
    if (typeof performance === "undefined" || !performance.getEntriesByType) return;
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (!nav) return;
    const payload = {
      type: "cn_page_perf",
      route: pathname,
      market: "cn",
      locale: "zh",
      dom_content_loaded_ms: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
      load_event_ms: Math.round(nav.loadEventEnd - nav.startTime),
      ttfb_ms: Math.round(nav.responseStart - nav.startTime)
    };
    try {
      console.info("[cn_page_perf]", JSON.stringify({ ...payload, ts: new Date().toISOString() }));
    } catch {
      /* ignore */
    }
  }, [pathname]);

  return null;
}
