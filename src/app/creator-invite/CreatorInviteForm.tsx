"use client";

import { useState } from "react";

export function CreatorInviteForm() {
  const [platform, setPlatform] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!platform.trim() || !handle.trim() || !email.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/creator-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, handle, email })
      });
      if (res.ok) {
        setSubmitted(true);
        setPlatform("");
        setHandle("");
        setEmail("");
      } else {
        const data = await res.json();
        alert(data.error ?? "Submission failed");
      }
    } catch {
      alert("Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <p className="font-medium text-emerald-800">Thanks for applying!</p>
        <p className="mt-2 text-sm text-emerald-700">
          We&apos;ll review your application and get back to you within a few days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="platform" className="block text-sm font-medium text-slate-700">
          Platform *
        </label>
        <select
          id="platform"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          required
          className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/70"
        >
          <option value="">Select...</option>
          <option value="tiktok">TikTok</option>
          <option value="youtube">YouTube</option>
          <option value="instagram">Instagram</option>
        </select>
      </div>
      <div>
        <label htmlFor="handle" className="block text-sm font-medium text-slate-700">
          Your handle / channel *
        </label>
        <input
          id="handle"
          type="text"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          required
          className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/70"
          placeholder="e.g. @yourhandle or Your Channel"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          Email *
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/70"
          placeholder="you@example.com"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-sky-600 px-5 py-3.5 text-base font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Apply"}
      </button>
    </form>
  );
}
