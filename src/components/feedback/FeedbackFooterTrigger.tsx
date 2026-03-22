"use client";

import { usePathname } from "next/navigation";
import { FeedbackLauncher } from "@/components/feedback/FeedbackLauncher";

type Props = {
  localeUi: "en" | "zh";
};

/** V100.3 — Subtle footer feedback entry (global + zh). */
export function FeedbackFooterTrigger({ localeUi }: Props) {
  const pathname = usePathname() || "/";
  const market = localeUi === "zh" ? "cn" : "global";
  const locale = localeUi === "zh" ? "zh" : "en";

  return (
    <FeedbackLauncher
      variant="footer"
      localeUi={localeUi}
      context={{
        route: pathname,
        market,
        locale,
        sourcePage: pathname,
        toolType: null,
        userPlan: null
      }}
    />
  );
}
