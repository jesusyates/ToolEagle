"use client";

import { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";

type Props = {
  answerSlug: string;
  content: string;
  variant?: "icon" | "button";
};

export function AnswerSaveButton({ answerSlug, content, variant = "button" }: Props) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch(`/api/saves/check?answerSlug=${encodeURIComponent(answerSlug)}`)
      .then((r) => r.json())
      .then((d) => {
        setSaved(d.saved ?? false);
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, [answerSlug]);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    if (saved) {
      const res = await fetch(`/api/saves?answerSlug=${encodeURIComponent(answerSlug)}`, {
        method: "DELETE"
      });
      if (res.ok) setSaved(false);
    } else {
      const res = await fetch("/api/saves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType: "answer",
          answerSlug,
          content
        })
      });
      const data = await res.json();
      if (data.requireLogin) {
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (res.ok && data.saved) setSaved(true);
    }
    setLoading(false);
  }

  if (!checked && variant === "icon") return null;

  if (variant === "icon") {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className="text-slate-400 hover:text-sky-600 disabled:opacity-50"
        title={saved ? "Unsave" : "Save"}
      >
        <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:border-sky-500/80 hover:bg-sky-50 hover:text-sky-700 disabled:opacity-50"
    >
      <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
      {saved ? "Saved" : "Save"}
    </button>
  );
}
