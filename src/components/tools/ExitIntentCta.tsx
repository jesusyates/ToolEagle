"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

/**
 * V72: Exit CTA - "Want more? Generate 100 more ideas free"
 * Triggers when mouse leaves viewport top (desktop)
 */
type Props = {
  toolSlug: string;
  toolName: string;
};

export function ExitIntentCta({ toolSlug, toolName }: Props) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const handleExitIntent = useCallback((e: MouseEvent) => {
    if (dismissed || visible) return;
    if (e.clientY <= 0) {
      setVisible(true);
    }
  }, [dismissed, visible]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (!isDesktop) return;
    document.addEventListener("mouseout", handleExitIntent);
    return () => document.removeEventListener("mouseout", handleExitIntent);
  }, [handleExitIntent]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={() => {
            setVisible(false);
            setDismissed(true);
          }}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
          aria-label="Close"
        >
          ✕
        </button>
        <h3 className="text-xl font-semibold text-slate-900">Want more?</h3>
        <p className="mt-2 text-sm text-slate-600">
          Generate 100 more ideas free. No signup required.
        </p>
        <Link
          href={`/tools/${toolSlug}`}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-sky-600 px-5 py-3.5 text-base font-semibold text-white hover:bg-sky-700 transition"
        >
          Try {toolName} →
        </Link>
      </div>
    </div>
  );
}
