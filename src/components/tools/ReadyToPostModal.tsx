"use client";

import chainTop1 from "@/config/v195-chain-top1-fix.json";
import { uploadUrlForPlatform } from "@/lib/creator-guidance/workflow-chain";
import { recordV187PublishRedirectClick } from "@/lib/creator-guidance/creator-memory-store";

const chainTop1Any = chainTop1 as any;

type Platform = "tiktok" | "youtube" | "instagram";

type Props = {
  open: boolean;
  onClose: () => void;
  platform?: Platform;
  /** V195 — which tool page opened the modal (TikTok chain analytics). */
  toolSlug?: string;
};

/**
 * V188 — After copy: suggest opening the native upload flow.
 */
export function ReadyToPostModal({ open, onClose, platform = "tiktok", toolSlug }: Props) {
  if (!open) return null;

  const url = uploadUrlForPlatform(platform);
  const tiktokFromV195 =
    platform === "tiktok" &&
    chainTop1Any.mode === "publish_handoff_cta" &&
    typeof chainTop1Any.readyToPost?.tiktokPrimaryLabel === "string"
      ? chainTop1Any.readyToPost.tiktokPrimaryLabel
      : null;
  const label =
    platform === "youtube"
      ? "Go to YouTube Studio"
      : platform === "instagram"
        ? "Open Instagram"
        : tiktokFromV195 ?? "Go to TikTok";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">Ready to post?</h2>
        <p className="mt-2 text-sm text-slate-600">You copied content — open upload and paste when you&apos;re ready.</p>
        <div className="mt-5 flex flex-col gap-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => recordV187PublishRedirectClick({ platform, toolSlug })}
            className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            {label}
          </a>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
