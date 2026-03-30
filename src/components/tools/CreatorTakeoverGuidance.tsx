"use client";

import Link from "next/link";
import { takeoverCoachingForBand, takeoverPrimaryLabel, takeoverSubline } from "@/lib/creator-guidance/takeover-copy";
import {
  buildWorkflowHref,
  nextWorkflowTool,
  prevWorkflowTool,
  workflowIndex
} from "@/lib/creator-guidance/workflow-chain";
import assets from "@/config/creator-knowledge-engine/v186-assets.json";
import { loadCreatorMemory } from "@/lib/creator-guidance/creator-memory-store";
import { computeCreatorScore } from "@/lib/creator-guidance/compute-creator-score";
import { useCreatorMemoryRevision } from "@/lib/creator-guidance/use-creator-memory-revision";
import { useMemo } from "react";

type Props = {
  toolSlug: string;
  intentId: string;
  scenarioId: string;
  topicHint: string;
  locale?: string;
  onPrimaryGenerate: () => void;
  isGenerating: boolean;
  /** V191.1 — optional CTA label override (e.g. bind to CreatorAnalysis issues). */
  primaryLabelOverride?: string;
};

/**
 * V188 — First-priority UI: step + strong CTA + workflow links.
 * V189 — Copy reflects Creator Score band + stage.
 */
export function CreatorTakeoverGuidance({
  toolSlug,
  intentId,
  scenarioId,
  topicHint,
  locale = "en",
  onPrimaryGenerate,
  isGenerating,
  primaryLabelOverride
}: Props) {
  const zhUi = locale.startsWith("zh");

  const memTick = useCreatorMemoryRevision();
  const score = useMemo(() => computeCreatorScore(loadCreatorMemory(), toolSlug), [toolSlug, memTick]);
  const idx = workflowIndex(toolSlug);
  /** Pipeline step 1 = choose direction (off-tool); tools start at 2 */
  const displayStep = idx >= 0 ? idx + 2 : 2;
  const intents = assets.intent_chips[toolSlug as keyof typeof assets.intent_chips] ?? [];
  const il = intents.find((x) => x.id === intentId)?.label ?? "Your intent";

  const next = nextWorkflowTool(toolSlug);
  const prev = prevWorkflowTool(toolSlug);
  const primaryLabel = primaryLabelOverride ?? takeoverPrimaryLabel(toolSlug);

  if (zhUi) return null;

  return (
    <div className="mb-5 rounded-2xl border-2 border-sky-500 bg-white p-4 shadow-lg ring-1 ring-sky-100">
      <p className="text-[11px] font-bold uppercase tracking-wide text-sky-900">
        Creator takeover · Step {displayStep} of 6 (workflow chain: 4 tools)
      </p>
      <h2 className="mt-2 text-xs font-semibold text-slate-500">
        {toolSlug === "hook-generator" && "[Step 2: Hook]"}
        {toolSlug === "tiktok-caption-generator" && "[Step 3: Caption pack]"}
        {toolSlug === "hashtag-generator" && "[Step 3–4: Hashtags]"}
        {toolSlug === "title-generator" && "[Step 4: Titles]"}
      </h2>
      <p className="mt-1 text-lg font-bold text-slate-900">
        👉 {il} — {takeoverSubline(intentId)}
      </p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {score.bandLabel} · {score.stage.title} · Score {score.score}/100
      </p>
      <p className="mt-2 text-xs text-slate-600">
        {takeoverCoachingForBand(score.band, score.stage.title, score.nextBestActionLabel)} Default intent and scenario are
        selected — generate with <strong>no typing</strong>, or add a topic below.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onPrimaryGenerate}
          disabled={isGenerating}
          className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60 cursor-pointer"
        >
          {isGenerating ? "Working…" : primaryLabel}
        </button>
        {next ? (
          <Link
            href={buildWorkflowHref(next, { intentId, scenarioId, topicHint })}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-semibold text-slate-800 hover:bg-slate-50"
          >
            Skip to next step
          </Link>
        ) : null}
        {prev ? (
          <Link
            href={buildWorkflowHref(prev, { intentId, scenarioId, topicHint })}
            className="inline-flex items-center justify-center rounded-xl border border-dashed border-slate-300 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            ← Previous
          </Link>
        ) : null}
      </div>
    </div>
  );
}
