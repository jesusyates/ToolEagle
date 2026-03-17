"use client";

import { useEffect, useRef } from "react";

type Props = {
  keyword?: string;
  slug?: string;
};

export function ZhPageViewTracker({ keyword, slug }: Props) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;

    fetch("/api/zh/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "page_view",
        event_data: { keyword: keyword || null, slug: slug || null }
      })
    }).catch(() => {});
  }, [keyword, slug]);

  return null;
}
