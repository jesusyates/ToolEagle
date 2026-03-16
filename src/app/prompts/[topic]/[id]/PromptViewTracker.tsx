"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

type Props = { topic: string; id: string };

export function PromptViewTracker({ topic, id }: Props) {
  useEffect(() => {
    trackEvent("prompt_view", { topic_slug: topic, prompt_id: id });
  }, [topic, id]);
  return null;
}
