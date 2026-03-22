"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

/**
 * V72: Exit CTA - "Want more? Generate 100 more ideas free"
 * Triggers when mouse leaves viewport top (desktop)
 */
type Props = {
  toolSlug: string;
  toolName: string;
  /** V97.1 — keep exit CTA inside /zh tool loop */
  siteMode?: "global" | "china";
};

const ZH_TOOL_HREF: Record<string, string> = {
  "tiktok-caption-generator": "/zh/tiktok-caption-generator",
  "hook-generator": "/zh/hook-generator",
  "ai-caption-generator": "/zh/ai-caption-generator",
  "douyin-caption-generator": "/zh/douyin-caption-generator",
  "douyin-hook-generator": "/zh/douyin-hook-generator",
  "douyin-script-generator": "/zh/douyin-script-generator",
  "douyin-topic-generator": "/zh/douyin-topic-generator",
  "douyin-comment-cta-generator": "/zh/douyin-comment-cta-generator",
  "douyin-structure-generator": "/zh/douyin-structure-generator"
};

export function ExitIntentCta({ toolSlug, toolName, siteMode = "global" }: Props) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const handleExitIntent = useCallback((e: MouseEvent) => {
    if (dismissed || visible) return;
    if (e.clientY <= 0) {
      setVisible(true);
    }
  }, [dismissed, visible]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (!isDesktop) return;
    document.addEventListener("mouseout", handleExitIntent);
    return () => document.removeEventListener("mouseout", handleExitIntent);
  }, [handleExitIntent]);

  if (!visible) return null;

  const zh = siteMode === "china";
  const href = zh ? ZH_TOOL_HREF[toolSlug] ?? `/zh/tools/${toolSlug}` : `/tools/${toolSlug}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={() => {
            setVisible(false);
            setDismissed(true);
          }}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
          aria-label="Close"
        >
          ✕
        </button>
        <h3 className="text-xl font-semibold text-slate-900">{zh ? "还想多要几套？" : "Want more?"}</h3>
        <p className="mt-2 text-sm text-slate-600">
          {zh
            ? "换个角度再生成几套结构，不用注册也能继续试。"
            : "Generate 100 more ideas free. No signup required."}
        </p>
        <Link
          href={href}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-sky-600 px-5 py-3.5 text-base font-semibold text-white hover:bg-sky-700 transition"
        >
          {zh ? `继续用 ${toolName} →` : `Try ${toolName} →`}
        </Link>
      </div>
    </div>
  );
}
