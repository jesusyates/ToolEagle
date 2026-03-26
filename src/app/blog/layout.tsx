import type { ReactNode } from "react";
import { BlogToolFunnelTrackerByPath } from "@/components/blog/BlogToolFunnelTrackerByPath";

/** V108: EN blog — tool click funnel (no visual change). Slug from pathname covers static + [slug]. */
export default function BlogLayout({ children }: { children: ReactNode }) {
  return <BlogToolFunnelTrackerByPath>{children}</BlogToolFunnelTrackerByPath>;
}
