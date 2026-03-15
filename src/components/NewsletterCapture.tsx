"use client";

import { useState, useEffect } from "react";
import { DelegatedButton } from "@/components/DelegatedButton";

const STORAGE_KEY = "tooleagle_newsletter_subscribed";

export function NewsletterCapture() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) {
      setStatus("success");
    }
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus("error");
      return;
    }

    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(stored)) {
        stored.push(trimmed);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([trimmed]));
      }
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
      <p className="text-sm font-semibold text-slate-900">
        Get creator ideas and new tools weekly
      </p>
      <p className="mt-1 text-xs text-slate-600">
        No spam. Unsubscribe anytime.
      </p>

      {status === "success" ? (
        <p className="mt-4 text-sm text-emerald-600 font-medium">
          Thanks! You&apos;re subscribed.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/70"
          />
          <DelegatedButton
            onClick={(e) => {
              const form = (e.target as Element).closest("[data-delegate-click]")?.closest("form");
              if (form) (form as HTMLFormElement).requestSubmit();
            }}
            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition duration-150"
          >
            Subscribe
          </DelegatedButton>
        </form>
      )}

      {status === "error" && (
        <p className="mt-2 text-xs text-amber-600">
          Something went wrong. Please try again.
        </p>
      )}
    </div>
  );
}
