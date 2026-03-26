"use client";

import { useMemo, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BlogToolFunnelTracker } from "@/components/blog/BlogToolFunnelTracker";

/**
 * V108: Derives blog slug from URL so all /blog/* routes (static + dynamic) share one funnel wrapper.
 */
export function BlogToolFunnelTrackerByPath({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const blogSlug = useMemo(() => {
    if (!pathname?.startsWith("/blog/")) return "";
    const rest = pathname.slice("/blog/".length);
    const seg = rest.split("/")[0];
    return seg || "";
  }, [pathname]);

  if (!blogSlug) return <>{children}</>;
  return <BlogToolFunnelTracker blogSlug={blogSlug}>{children}</BlogToolFunnelTracker>;
}
