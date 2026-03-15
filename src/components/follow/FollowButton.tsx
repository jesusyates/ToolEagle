"use client";

import { useState, useEffect } from "react";
import { UserPlus } from "lucide-react";

type Props = {
  username: string;
  variant?: "icon" | "button";
};

export function FollowButton({ username, variant = "button" }: Props) {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch(`/api/follows/check?username=${encodeURIComponent(username)}`)
      .then((r) => r.json())
      .then((d) => {
        setFollowing(d.following ?? false);
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, [username]);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    if (following) {
      const res = await fetch(`/api/follows?username=${encodeURIComponent(username)}`, {
        method: "DELETE"
      });
      if (res.ok) setFollowing(false);
    } else {
      const res = await fetch("/api/follows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      if (data.requireLogin) {
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (res.ok && data.following) setFollowing(true);
    }
    setLoading(false);
  }

  if (!checked) return null;

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={
        variant === "icon"
          ? "inline-flex items-center gap-1 text-slate-500 hover:text-sky-600 disabled:opacity-50"
          : "inline-flex items-center gap-2 rounded-lg border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100 disabled:opacity-50"
      }
    >
      <UserPlus className="h-4 w-4" />
      {following ? "Following" : "Follow"}
    </button>
  );
}
