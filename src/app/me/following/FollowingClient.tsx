"use client";

import { useState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";

type Follow = {
  following_username: string;
  created_at: string;
};

export function FollowingClient({ initialFollows }: { initialFollows: Follow[] }) {
  const [follows, setFollows] = useState(initialFollows);

  async function handleUnfollow(username: string) {
    const res = await fetch(`/api/follows?username=${encodeURIComponent(username)}`, {
      method: "DELETE"
    });
    if (res.ok) setFollows((f) => f.filter((x) => x.following_username !== username));
  }

  if (follows.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50/50 p-12 text-center">
        <UserPlus className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-600 font-medium">Not following anyone yet</p>
        <p className="text-sm text-slate-500 mt-1">
          Visit creator profiles and click Follow to add them here.
        </p>
        <Link
          href="/creators"
          className="mt-6 inline-flex rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700"
        >
          Discover creators
        </Link>
      </div>
    );
  }

  return (
    <ul className="mt-8 space-y-3">
      {follows.map((f) => (
        <li
          key={f.following_username}
          className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
        >
          <Link
            href={`/creators/${f.following_username}`}
            className="font-medium text-sky-600 hover:underline"
          >
            @{f.following_username}
          </Link>
          <button
            onClick={() => handleUnfollow(f.following_username)}
            className="text-sm text-slate-500 hover:text-red-600"
          >
            Unfollow
          </button>
        </li>
      ))}
    </ul>
  );
}
