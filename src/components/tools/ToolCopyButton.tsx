"use client";

import { useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Copy, Check } from "lucide-react";
import { useDelegatedClick } from "@/hooks/useDelegatedClick";
import { safeCopyToClipboard } from "@/lib/clipboard";

type ToolCopyButtonProps = {
  labelKey?: "copy" | "copyAll";
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  variant?: "default" | "primary";
  /** When provided, copies displayed text from DOM (supports browser translation). Falls back to onClick if null. */
  getTextToCopy?: (buttonElement: Element) => string | null;
  /** V72: Called after any successful copy (for analytics). Use when getTextToCopy is used so onClick isn't called. */
  onCopied?: () => void;
};

const COPIED_DURATION_MS = 1500;

export function ToolCopyButton({
  labelKey = "copy",
  onClick,
  disabled,
  variant = "default",
  getTextToCopy,
  onCopied
}: ToolCopyButtonProps) {
  const t = useTranslations("common");
  const copiedRef = useRef(false);

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      if (disabled || copiedRef.current) return;
      try {
        const btn = (e.target as Element)?.closest?.("[data-delegate-click]") as HTMLElement;
        if (getTextToCopy && btn) {
          const text = getTextToCopy(btn);
          if (text) {
            const ok = await safeCopyToClipboard(text);
            if (ok) {
              copiedRef.current = true;
              btn.dataset.copied = "true";
              onCopied?.();
              setTimeout(() => {
                copiedRef.current = false;
                btn.dataset.copied = "false";
              }, COPIED_DURATION_MS);
            }
            return;
          }
        }
        await onClick();
        onCopied?.();
        if (btn) {
          copiedRef.current = true;
          btn.dataset.copied = "true";
          setTimeout(() => {
            copiedRef.current = false;
            btn.dataset.copied = "false";
          }, COPIED_DURATION_MS);
        }
      } catch {
        // no feedback on error
      }
    },
    [disabled, onClick, getTextToCopy, onCopied]
  );

  const delegatedProps = useDelegatedClick(handleClick);

  const isPrimary = variant === "primary";
  const baseClass = "inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition duration-150 disabled:opacity-60 disabled:cursor-not-allowed";
  const primaryClass = "bg-sky-600 text-white hover:bg-sky-700 border-0";
  const defaultClass = "border border-slate-300 bg-white text-slate-800 hover:border-sky-500/80 hover:bg-sky-50 hover:text-sky-700";

  return (
    <button
      type="button"
      {...delegatedProps}
      data-copied="false"
      disabled={disabled}
      className={`${baseClass} ${isPrimary ? primaryClass : defaultClass} [&[data-copied=true]_[data-copy-label]]:hidden [&[data-copied=true]_[data-copied-label]]:!inline-flex`}
    >
      <span data-copy-label className="inline-flex items-center gap-1.5">
        <Copy className="h-4 w-4" />
        {t(labelKey === "copyAll" ? "copyAll" : "copy")}
      </span>
      <span data-copied-label className="hidden items-center gap-1.5">
        <Check className="h-4 w-4" />
        {t("copied")}
      </span>
    </button>
  );
}

