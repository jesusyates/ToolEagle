"use client";

import { useState } from "react";
import Link from "next/link";
import { DelegatedButton } from "@/components/DelegatedButton";

type Platform = "tiktok" | "youtube" | "instagram";
type ContentType = "caption" | "hook" | "title";

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "instagram", label: "Instagram" }
];

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: "caption", label: "Caption" },
  { value: "hook", label: "Hook" },
  { value: "title", label: "Title" }
];

export function SubmitFormClient() {
  const [platform, setPlatform] = useState<Platform>("tiktok");
  const [contentType, setContentType] = useState<ContentType>("caption");
  const [content, setContent] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [slug, setSlug] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/submit-example", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          contentType,
          content: content.trim(),
          creatorName: creatorName.trim() || undefined
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? "Submission failed");
        setStatus("error");
        return;
      }

      setSlug(data.slug ?? null);
      setStatus("success");
      setContent("");
    } catch {
      setErrorMsg("Submission failed");
      setStatus("error");
    }
  }

  return (
    <div className="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">Platform</label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as Platform)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            {PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Content type</label>
          <select
            value={contentType}
            onChange={(e) => setContentType(e.target.value as ContentType)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            {CONTENT_TYPES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Content *</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your caption, hook, or title..."
            required
            rows={4}
            maxLength={2000}
            className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          <p className="mt-1 text-xs text-slate-500">{content.length}/2000</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Creator name (optional)</label>
          <input
            type="text"
            value={creatorName}
            onChange={(e) => setCreatorName(e.target.value)}
            placeholder="Your @username or display name"
            maxLength={100}
            className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        {status === "error" && (
          <p className="text-sm text-red-600">{errorMsg}</p>
        )}

        {status === "success" && slug && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="font-medium text-emerald-800">Thanks! Your content has been submitted.</p>
            <Link
              href={`/examples/${slug}`}
              className="mt-2 inline-block text-sm font-medium text-emerald-700 hover:underline"
            >
              View your example →
            </Link>
          </div>
        )}

        <button
          type="submit"
          disabled={status === "loading" || !content.trim()}
          className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50 transition"
        >
          {status === "loading" ? "Submitting..." : "Submit"}
        </button>
      </form>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link href="/examples" className="text-sm font-medium text-sky-600 hover:underline">
          Browse examples →
        </Link>
        <Link href="/tools" className="text-sm font-medium text-sky-600 hover:underline">
          AI Tools →
        </Link>
      </div>
    </div>
  );
}
