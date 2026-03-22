"use client";

/**
 * V83: Guided Posting Mode - Step-by-step flow
 */

import { useTranslations } from "next-intl";
import { ZhCopyButton } from "@/components/zh/ZhCopyButton";

const PLATFORM_LINKS: Record<string, string> = {
  reddit: "https://www.reddit.com/submit",
  x: "https://twitter.com/intent/tweet",
  quora: "https://www.quora.com/"
};

type Props = {
  open: boolean;
  onClose: () => void;
  item: {
    id: string;
    title: string;
    reddit_title?: string;
    reddit_body?: string;
    x_thread?: string;
    quora_answer?: string;
    page_url?: string;
  } | null;
  platform: "reddit" | "x" | "quora";
  onDone: () => void;
};

export function GuidedPostingModal({ open, onClose, item, platform, onDone }: Props) {
  const t = useTranslations("guidedPosting");

  if (!open || !item) return null;

  const content =
    platform === "reddit"
      ? `${item.reddit_title || ""}\n\n${item.reddit_body || ""}`.trim()
      : platform === "x"
        ? item.x_thread || ""
        : item.quora_answer || "";

  const platformLabel =
    platform === "reddit"
      ? t("platformLabel.reddit")
      : platform === "x"
        ? t("platformLabel.x")
        : t("platformLabel.quora");
  const openUrl = PLATFORM_LINKS[platform];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">{t("title", { platform: platformLabel })}</h3>
        <p className="mt-1 text-sm text-slate-600">{item.title}</p>

        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-600 text-sm font-bold text-white">
              1
            </span>
            <div className="flex-1">
              <p className="font-medium text-slate-800">{t("stepCopy")}</p>
              <div className="mt-1 flex gap-2">
                <pre className="max-h-24 flex-1 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700 whitespace-pre-wrap">
                  {content.slice(0, 300)}
                  {content.length > 300 ? "…" : ""}
                </pre>
                <ZhCopyButton text={content} label={t("copyButton")} className="shrink-0" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-600 text-sm font-bold text-white">
              2
            </span>
            <div className="flex-1">
              <p className="font-medium text-slate-800">{t("stepOpen")}</p>
              <a
                href={openUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-sm text-sky-600 hover:underline"
              >
                {t("openLink", { platform: platformLabel })}
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-600 text-sm font-bold text-white">
              3
            </span>
            <p className="flex-1 font-medium text-slate-800">{t("stepPaste")}</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-500">
              4
            </span>
            <div className="flex-1">
              <p className="font-medium text-slate-800">{t("stepDone")}</p>
              <button
                type="button"
                onClick={() => {
                  onDone();
                  onClose();
                }}
                className="mt-2 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                {t("doneButton")}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {t("cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
