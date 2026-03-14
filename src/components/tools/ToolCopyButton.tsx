"use client";

import { useState } from "react";

type ToolCopyButtonProps = {
  label: string;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
};

const COPIED_DURATION_MS = 1500;

export function ToolCopyButton({ label, onClick, disabled }: ToolCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    if (disabled || copied) return;
    try {
      await onClick();
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_DURATION_MS);
    } catch {
      // no feedback on error
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-medium text-slate-800 hover:border-sky-500/80 hover:bg-gray-100 hover:text-sky-700 disabled:opacity-60 disabled:cursor-not-allowed transition duration-150"
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}

