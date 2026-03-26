"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

/**
 * V108: One beacon per tool page load — captures internal blog referrer for conversion mapping.
 */
export function ToolEntrySourceTracker() {
  const pathname = usePathname();
  const sent = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname?.startsWith("/tools/")) return;
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length < 2) return;
    const toolSlug = parts[1];
    const key = `${pathname}`;
    if (sent.current === key) return;
    sent.current = key;

    const ref = typeof document !== "undefined" ? document.referrer : "";
    let sourceSlug: string | null = null;
    let sourceKind: "internal_blog" | "external" = "external";

    try {
      if (ref) {
        const u = new URL(ref);
        if (u.pathname.startsWith("/blog/")) {
          const m = u.pathname.match(/^\/blog\/([^/]+)/);
          if (m?.[1]) {
            sourceSlug = m[1];
            sourceKind = "internal_blog";
          }
        }
      }
    } catch {
      // ignore
    }

    trackEvent("tool_entry_from_blog", {
      tool_slug: toolSlug,
      source_page: sourceSlug ?? "",
      page_type: sourceKind === "internal_blog" ? "tool_entry_blog" : "tool_entry_external"
    });

    fetch("/api/analytics/tool-funnel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "tool_entry",
        toolSlug,
        sourceSlug,
        sourceKind,
        referrer: ref || null,
        ts: new Date().toISOString()
      })
    }).catch(() => {});
  }, [pathname]);

  return null;
}
