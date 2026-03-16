"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
import type { GuidePageType } from "@/config/traffic-topics";

type Props = { pageType: GuidePageType; topic: string };

export function GuideViewTracker({ pageType, topic }: Props) {
  useEffect(() => {
    trackEvent("guide_view", { topic_slug: topic, page_type: pageType });
  }, [pageType, topic]);
  return null;
}
