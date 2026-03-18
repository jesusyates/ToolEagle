"use client";

import { useState } from "react";
import { ZhCopySharePack } from "./ZhCopySharePack";

type Props = {
  title: string;
  oneLiner: string;
  pageUrl: string;
  keyword: string;
};

export function ZhCopySharePackWithLog(props: Props) {
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
        setLogging(null);
      }
    } catch {
      setLogging(null);
    }
  };

  return (
    <ZhCopySharePack
      {...props}
      onPublished={handlePublished}
    />
  );
}
