"use client";

import { useState } from "react";
import { FeedbackModal, type FeedbackContextPayload } from "@/components/feedback/FeedbackModal";

type FeedbackLauncherProps = {
  variant: "inline" | "footer";
  localeUi: "en" | "zh";
  context: FeedbackContextPayload;
};

/**
 * V100.3 — Low-disruption entry to feedback modal.
 */
export function FeedbackLauncher({ variant, localeUi, context }: FeedbackLauncherProps) {
  const [open, setOpen] = useState(false);
  const zh = localeUi === "zh";

  if (variant === "footer") {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-slate-400 hover:text-sky-700 hover:underline text-xs"
        >
          {zh ? "反馈 / 建议" : "Feedback"}
        </button>
        <FeedbackModal open={open} onClose={() => setOpen(false)} context={context} localeUi={localeUi} />
      </>
    );
  }

  return (
    <>
      <div className="mt-3 pt-3 border-t border-slate-100/80">
        <p className="text-[11px] text-slate-500 mb-1.5">
          {zh ? "遇到问题或有想法？" : "Something wrong or an idea?"}
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-[11px] font-medium text-slate-500 hover:text-sky-700 hover:underline"
          >
            {zh ? "反馈问题" : "Report an issue"}
          </button>
          <span className="text-slate-300 text-[11px]">·</span>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-[11px] font-medium text-slate-500 hover:text-sky-700 hover:underline"
          >
            {zh ? "提个建议" : "Request a feature"}
          </button>
        </div>
      </div>
      <FeedbackModal open={open} onClose={() => setOpen(false)} context={context} localeUi={localeUi} />
    </>
  );
}
