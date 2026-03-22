"use client";

/**
 * V81: ShareStrategyBlock with backlink logging on "I published"
 */

import { useState } from "react";
import { ShareStrategyBlock } from "./ShareStrategyBlock";

type Props = {
  title: string;
  oneLiner: string;
  pageUrl: string;
  slug: string;
  lang: "zh" | "en" | "es" | "pt";
  keyword: string;
};

export function ShareStrategyBlockWithLog(props: Props) {
  const [logging, setLogging] = useState<string | null>(null);

  const handlePublished = async (platform: "reddit" | "x" | "quora") => {
    setLogging(platform);
    try {
      const res = await fetch("/api/backlinks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: props.pageUrl,
          platform,
          keyword: props.keyword
        })
      });
      if (res.ok) {
        fetch("/api/zh/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_type: "share_click",
            event_data: { platform, keyword: props.keyword || null, slug: props.slug }
          })
        }).catch(() => {});
        setLogging(null);
      }
    } catch {
      setLogging(null);
    }
  };

  return (
    <ShareStrategyBlock
      {...props}
      onPublished={handlePublished}
    />
  );
}
