"use client";

import { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";

type Props = {
  itemType: "caption" | "hook";
  toolSlug: string;
  toolName: string;
  content: string;
  contentId?: string;
  variant?: "icon" | "button";
};

export function ContentSaveButton({
  itemType,
  toolSlug,
  toolName,
  content,
  contentId,
  variant = "button"
}: Props) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    const res = await fetch("/api/saves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemType,
        toolSlug,
        toolName,
        content
      })
    });
    const data = await res.json();
    if (data.requireLogin) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    if (res.ok && data.saved) setSaved(true);
    setLoading(false);
  }

  if (variant === "icon") {
    return (
      <button
        onClick={handleClick}
        disabled={loading || saved}
        className="text-slate-400 hover:text-sky-600 disabled:opacity-50"
        title={saved ? "Saved" : "Save"}
      >
        <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading || saved}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:border-sky-500/80 hover:bg-sky-50 hover:text-sky-700 disabled:opacity-50"
    >
      <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
      {saved ? "Saved" : "Save"}
    </button>
  );
}
