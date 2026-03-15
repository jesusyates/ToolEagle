"use client";

import Link from "next/link";

const MESSAGE =
  "You've reached today's free limit. Upgrade to Pro for unlimited AI generation.";

type LimitReachedModalProps = {
  open: boolean;
  onClose: () => void;
};

export function LimitReachedModal({ open, onClose }: LimitReachedModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="limit-modal-title"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="limit-modal-title" className="text-lg font-semibold text-slate-900">
          Daily limit reached
        </h2>
        <p className="mt-2 text-sm text-slate-600">{MESSAGE}</p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/pricing"
            className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-slate-800"
          >
            Upgrade to Pro
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
