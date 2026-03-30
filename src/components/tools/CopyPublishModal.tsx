"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

type Props = {
  open: boolean;
  onClose: () => void;
  publishUrl: string | null;
  toolSlug: string;
};

/**
 * V171.1 — After successful copy on EN tool pages, nudge user to open the target platform.
 */
export function CopyPublishModal({ open, onClose, publishUrl, toolSlug }: Props) {
  const shownForOpenCycle = useRef(false);
  useEffect(() => {
    if (!open) {
      shownForOpenCycle.current = false;
      return;
    }
    if (shownForOpenCycle.current) return;
    shownForOpenCycle.current = true;
    trackEvent("copy_modal_shown", {
      tool_slug: toolSlug,
      has_publish_url: publishUrl ? 1 : 0
    });
  }, [open, publishUrl, toolSlug]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="copy-publish-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <h2 id="copy-publish-title" className="text-lg font-semibold text-slate-900">
          Ready to publish?
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Your copy is ready. Open your app and paste when you&apos;re on the upload screen.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => {
                trackEvent("publish_redirect_cancel", { tool_slug: toolSlug });
                onClose();
              }}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          {publishUrl ? (
            <a
              href={publishUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackEvent("publish_redirect_click", { tool_slug: toolSlug });
                fetch("/api/analytics/tool-funnel", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    type: "publish_redirect_click",
                    toolSlug,
                    ts: new Date().toISOString()
                  })
                }).catch(() => {});
                onClose();
              }}
              className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
            >
              Go to platform
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
