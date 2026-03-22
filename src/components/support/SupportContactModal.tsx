"use client";

import { SupportContactBody } from "@/components/support/SupportContactBody";

type Props = {
  open: boolean;
  onClose: () => void;
  sourcePage: string;
};

/** Human support channels in a dialog — same content as former #support-contact section. */
export function SupportContactModal({ open, onClose, sourcePage }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="人工帮助"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-800 text-xl leading-none z-10"
          aria-label="关闭"
        >
          ×
        </button>

        <div className="pr-6">
          <SupportContactBody sourcePage={sourcePage} embedStyle="plain" />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:w-auto"
        >
          关闭
        </button>
      </div>
    </div>
  );
}
