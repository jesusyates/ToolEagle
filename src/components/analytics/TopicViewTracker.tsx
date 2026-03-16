"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

type Props = { topicSlug: string };

export function TopicViewTracker({ topicSlug }: Props) {
  useEffect(() => {
    trackEvent("topic_view", { topic_slug: topicSlug });
  }, [topicSlug]);
  return null;
}
