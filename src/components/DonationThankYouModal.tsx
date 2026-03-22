"use client";

import Link from "next/link";

type DonationThankYouModalProps = {
  open: boolean;
  onClose: () => void;
  /** V100.1 — Pro upgrade bridge */
  upgradeHref?: string;
  upgradeLabel?: string;
};

export function DonationThankYouModal({
  open,
  onClose,
  upgradeHref = "/zh/pricing",
  upgradeLabel = "了解 Pro 权益"
}: DonationThankYouModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="donation-thank-title"
    >
      <div className="relative max-w-md w-full rounded-2xl bg-white border-2 border-red-200 shadow-xl p-6 text-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 text-lg leading-none"
          aria-label="关闭"
        >
          ×
        </button>
        <p id="donation-thank-title" className="text-xl font-bold text-slate-900">
          感谢你的支持 ❤️
        </p>
        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
          你的支持会直接用于模型与服务器成本，也让我们能持续打磨中文站体验。
        </p>
        <p className="mt-4 text-sm font-medium text-slate-800">
          想获得更强功能，可以升级 Pro
        </p>
        <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            href={upgradeHref}
            className="inline-flex justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            onClick={onClose}
          >
            {upgradeLabel} →
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            先逛逛
          </button>
        </div>
      </div>
    </div>
  );
}
