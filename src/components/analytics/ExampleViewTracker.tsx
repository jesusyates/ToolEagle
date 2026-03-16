"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

type Props = { exampleSlug: string };

export function ExampleViewTracker({ exampleSlug }: Props) {
  useEffect(() => {
    trackEvent("example_view", { example_slug: exampleSlug });
  }, [exampleSlug]);
  return null;
}
