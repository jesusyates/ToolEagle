"use client";

import { useCallback, type ReactNode } from "react";
import { trackEvent } from "@/lib/analytics";

type Props = {
  blogSlug: string;
  children: ReactNode;
};

/**
 * V108: Delegated capture for clicks on /tools/* from EN blog content (MDX + CTAs).
 * No layout change — wraps article only.
 */
export function BlogToolFunnelTracker({ blogSlug, children }: Props) {
  const onClickCapture = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const t = e.target as HTMLElement | null;
      const a = t?.closest?.("a") as HTMLAnchorElement | null;
      if (!a?.href) return;
      let url: URL;
      try {
        url = new URL(a.href, typeof window !== "undefined" ? window.location.origin : "https://www.tooleagle.com");
      } catch {
        return;
      }
      if (typeof window !== "undefined" && url.origin !== window.location.origin) return;
      const pathname = url.pathname;
      if (!pathname.startsWith("/tools/")) return;
      const parts = pathname.split("/").filter(Boolean);
      if (parts.length < 2) return;
      const toolSlug = parts[1];

      trackEvent("blog_tool_click", {
        tool_slug: toolSlug,
        source_page: blogSlug,
        page_type: "blog"
      });

      fetch("/api/analytics/tool-funnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "tool_click",
          sourceSlug: blogSlug,
          toolSlug,
          targetPath: pathname,
          ts: new Date().toISOString()
        })
      }).catch(() => {});
    },
    [blogSlug]
  );

  return <div onClickCapture={onClickCapture}>{children}</div>;
}
