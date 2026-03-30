"use client";

import Link from "next/link";
import chainTop1 from "@/config/v195-chain-top1-fix.json";
import {
  buildWorkflowHref,
  nextWorkflowTitle,
  nextWorkflowTool,
  workflowIndex,
  uploadUrlForPlatform,
  defaultUploadPlatformForTool
} from "@/lib/creator-guidance/workflow-chain";

const chainTop1Any = chainTop1 as any;

type Props = {
  toolSlug: string;
  hasResults: boolean;
  intentId: string;
  scenarioId: string;
  topicHint: string;
  locale?: string;
};

/**
 * V188 — Mandatory next-step after generation (buttons, not text-only).
 */
export function WorkflowNextStepCard({
  toolSlug,
  hasResults,
  intentId,
  scenarioId,
  topicHint,
  locale = "en"
}: Props) {
  if (!hasResults || locale.startsWith("zh")) return null;

  const next = nextWorkflowTool(toolSlug);
  const idx = workflowIndex(toolSlug);
  const displayStep = idx >= 0 ? idx + 2 : 2;

  if (next) {
    const href = buildWorkflowHref(next, { intentId, scenarioId, topicHint });
    const title = nextWorkflowTitle(toolSlug);
    const isStrongHashtag =
      toolSlug === "hashtag-generator" &&
      chainTop1Any.mode === "title_handoff_visibility" &&
      chainTop1Any.workflowNext?.hashtagCardEmphasis === "strong";
    const nextCardClass = isStrongHashtag
      ? "mb-4 rounded-2xl border-2 border-violet-500 bg-gradient-to-br from-violet-50 to-white px-4 py-4 shadow-lg ring-2 ring-violet-100"
      : "mb-4 rounded-2xl border-2 border-violet-400 bg-gradient-to-br from-violet-50 to-white px-4 py-4 shadow-md";
    const continueLabel =
      toolSlug === "hook-generator" &&
      chainTop1Any.mode === "caption_handoff_cta" &&
      typeof chainTop1Any.workflowNext?.hookGeneratorContinueLabel === "string"
        ? chainTop1Any.workflowNext.hookGeneratorContinueLabel
        : "Continue to next tool →";
    const bridgeSubtitle =
      toolSlug === "tiktok-caption-generator" &&
      chainTop1Any.mode === "hashtag_handoff_copy" &&
      typeof chainTop1Any.workflowNext?.captionNextSubtitle === "string"
        ? chainTop1Any.workflowNext.captionNextSubtitle
        : "Your intent & scenario travel with you — no need to re-type the brief.";
    return (
      <div className={nextCardClass}>
        <p className="text-[11px] font-bold uppercase tracking-wide text-violet-800">Step {displayStep} of 4 · TikTok chain</p>
        <p className="mt-1 text-base font-bold text-slate-900">
          👉 Next: {title}
        </p>
        <p className="mt-1 text-xs text-slate-600">{bridgeSubtitle}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={href}
            className="inline-flex w-full items-center justify-center rounded-xl bg-violet-600 px-4 py-3.5 text-sm font-bold text-white shadow-sm ring-2 ring-violet-200 hover:bg-violet-700"
          >
            {continueLabel}
          </Link>
        </div>
        <p className="mt-2 text-[10px] text-slate-500">Chain order: Hook → Caption → Hashtags → Title → Ready to post</p>
      </div>
    );
  }

  const uploadPlat = defaultUploadPlatformForTool(toolSlug);
  const uploadLabel =
    uploadPlat === "youtube"
      ? "Open YouTube upload"
      : uploadPlat === "instagram"
        ? "Open Instagram"
        : "Open TikTok upload";

  return (
    <div className="mb-4 rounded-2xl border-2 border-emerald-400 bg-gradient-to-br from-emerald-50 to-white px-4 py-4 shadow-md">
      <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-900">Step 4 of 4 · Ready to post</p>
      <p className="mt-1 text-base font-bold text-slate-900">👉 Copy blocks, then publish</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={uploadUrlForPlatform(uploadPlat)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-bold text-white ring-2 ring-slate-300 hover:bg-slate-800"
        >
          {uploadLabel}
        </a>
        <Link
          href={buildWorkflowHref("hook-generator", { intentId, scenarioId, topicHint })}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Start new chain (Hook)
        </Link>
      </div>
    </div>
  );
}
