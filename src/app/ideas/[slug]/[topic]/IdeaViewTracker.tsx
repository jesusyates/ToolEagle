"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

type Props = { slug: string; id: string };

export function IdeaViewTracker({ slug, id }: Props) {
  useEffect(() => {
    trackEvent("idea_view", { topic_slug: slug, prompt_id: id });
  }, [slug, id]);
  return null;
}
