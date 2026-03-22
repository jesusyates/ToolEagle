"use client";

import { useEffect } from "react";
import { trackConversion } from "@/lib/analytics/conversionClient";

/** V96: fire once per pricing page mount */
export function PricingConversionTracker() {
  useEffect(() => {
    trackConversion("pricing_open", { source: "pricing_page" });
  }, []);
  return null;
}
