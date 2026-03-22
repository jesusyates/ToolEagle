"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getUpgradeHref, hasPaymentLink, type UpgradeMarket } from "@/config/payment";
import { trackConversion } from "@/lib/analytics/conversionClient";
import { COOKIE_PREFERRED_MARKET } from "@/config/market";

type Props = {
  className?: string;
  children: React.ReactNode;
  /** Opens checkout in new tab when payment link is set */
  external?: boolean;
  /** V96: set false to skip analytics */
  track?: boolean;
  /** Passed to conversion payload */
  conversionSource?: string;
};

export function UpgradeLink({
  className,
  children,
  external = true,
  track = true,
  conversionSource = "upgrade_link"
}: Props) {
  const [market, setMarket] = useState<UpgradeMarket>("global");
  useEffect(() => {
    if (typeof document === "undefined") return;
    const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_PREFERRED_MARKET}=([^;]*)`));
    const v = m?.[1] === "cn" ? "cn" : "global";
    setMarket(v);
  }, []);

  const href = getUpgradeHref(market);
  const isExt = external && hasPaymentLink() && market !== "cn";

  function handleClick() {
    if (!track) return;
    const event = isExt ? "payment_click" : "upgrade_click";
    trackConversion(event, { source: conversionSource });
  }

  if (isExt) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={handleClick}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
