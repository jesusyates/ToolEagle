"use client";

import Link from "next/link";

type LoginPromptModalProps = {
  open: boolean;
  onClose: () => void;
  message?: string;
};

export function LoginPromptModal({
  open,
  onClose,
  message = "Please log in to save your content."
}: LoginPromptModalProps) {
  if (!open) return null;

  const loginUrl = `/login?next=${encodeURIComponent(
    typeof window !== "undefined" ? window.location.pathname : "/"
  )}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="login-modal-title" className="text-lg font-semibold text-slate-900">
          Log in required
        </h2>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-6 flex gap-3">
          <Link
            href={loginUrl}
            className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-slate-800"
          >
            Log in
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
