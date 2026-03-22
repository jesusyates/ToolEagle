"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";

type Props = {
  initialUsername: string;
  initialDisplayName: string;
  initialBio: string;
};

export function ProfileSettingsForm({ initialUsername, initialDisplayName, initialBio }: Props) {
  const t = useTranslations("profileSettings");
  const [username, setUsername] = useState(initialUsername);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: username.trim() || null,
          display_name: displayName.trim() || null,
          bio: bio.trim() || null
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : t("saveFailed"));
        return;
      }
      setSuccess(true);
      router.refresh();
    } catch {
      setError(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  const slugPreview = username.trim() || "username";

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-slate-700">
          {t("username")}
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={t("usernamePlaceholder")}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/70"
        />
        <p className="mt-1 text-xs text-slate-500">{t("usernameHint", { slug: slugPreview })}</p>
      </div>

      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-slate-700">
          {t("displayName")}
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={t("displayNamePlaceholder")}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/70"
        />
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-slate-700">
          {t("bio")}
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder={t("bioPlaceholder")}
          rows={3}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/70"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{t("saved")}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? t("saving") : t("save")}
        </button>
        {username.trim() && (
          <Link
            href={`/creators/${username.trim()}`}
            className="text-sm font-medium text-sky-600 hover:underline"
          >
            {t("viewProfile")}
          </Link>
        )}
      </div>
    </form>
  );
}
