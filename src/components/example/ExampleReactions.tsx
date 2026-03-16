"use client";

import { useState, useEffect } from "react";
import { Heart, Share2 } from "lucide-react";
import { SaveButton } from "@/components/save/SaveButton";
import { safeCopyToClipboard } from "@/lib/clipboard";
import { trackEvent } from "@/lib/analytics";

type Props = {
  exampleSlug: string;
  content: string;
};

export function ExampleReactions({ exampleSlug, content }: Props) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch(`/api/example-like?exampleSlug=${encodeURIComponent(exampleSlug)}`)
      .then((r) => r.json())
      .then((d) => {
        setLiked(d.liked ?? false);
        setLikeCount(d.count ?? 0);
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, [exampleSlug]);

  async function handleLike() {
    if (loading) return;
    setLoading(true);
    const res = await fetch("/api/example-like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exampleSlug,
        action: liked ? "unlike" : "like"
      })
    });
    const data = await res.json();
    if (data.requireLogin) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    if (res.ok) {
      setLiked(data.liked);
      setLikeCount((c) => (data.liked ? c + 1 : Math.max(0, c - 1)));
      if (data.liked) trackEvent("example_like", { example_slug: exampleSlug });
    }
    setLoading(false);
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Creator Example | ToolEagle",
          text: content.slice(0, 100),
          url
        });
      } catch {
        await safeCopyToClipboard(url);
      }
    } else {
      await safeCopyToClipboard(url);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={handleLike}
        disabled={loading || !checked}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
          liked
            ? "bg-red-50 text-red-600"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }`}
      >
        <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
        {likeCount > 0 && <span>{likeCount}</span>}
      </button>
      <SaveButton exampleSlug={exampleSlug} content={content} variant="button" />
      <button
        onClick={handleShare}
        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 transition"
      >
        <Share2 className="h-4 w-4" />
        Share
      </button>
    </div>
  );
}
