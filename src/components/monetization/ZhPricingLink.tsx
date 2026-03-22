"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { trackConversion } from "@/lib/analytics/conversionClient";

type Props = {
  href?: string;
  /** V101 — jump to CN Pro checkout anchor */
  hash?: string;
  className?: string;
  /** Analytics source; defaults for low-friction links (header, home) */
  conversionSource?: string;
  /** V104.2 — e.g. Douyin funnel side-effects after click */
  afterClick?: () => void;
  children: ReactNode;
};

/** V97.1 — Primary upgrade CTA stays on /zh/pricing before global checkout */
export function ZhPricingLink({
  href = "/zh/pricing",
  hash = "",
  className,
  conversionSource = "zh_pricing_generic",
  afterClick,
  children
}: Props) {
  const fullHref = `${href}${hash.startsWith("#") ? hash : hash ? `#${hash}` : ""}`;
  return (
    <Link
      href={fullHref}
      className={className}
      onClick={() => {
        afterClick?.();
        trackConversion("pricing_open", { source: conversionSource });
      }}
    >
      {children}
    </Link>
  );
}
