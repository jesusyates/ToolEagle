"use client";

import { useEffect, useRef } from "react";

type Props = {
  keyword?: string;
  slug?: string;
  /** V89: page_type for AI visibility tracking (en-how-to, zh-search, etc.) */
  pageType?: string;
};

export function ZhPageViewTracker({ keyword, slug, pageType }: Props) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;

    fetch("/api/zh/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "page_view",
        event_data: { keyword: keyword || null, slug: slug || null, page_type: pageType || null }
      })
    }).catch(() => {});
  }, [keyword, slug, pageType]);

  return null;
}
