"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadCreatorMemory, setCreatorMemoryUserId } from "@/lib/creator-guidance/creator-memory-store";
import { computeGuidance } from "@/lib/creator-guidance/compute-guidance";
import { inferCreatorProfile } from "@/lib/creator-guidance/infer-creator-profile";
import { computeCreatorScore } from "@/lib/creator-guidance/compute-creator-score";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  toolSlug: string;
  /** above_input = workflow + next step; above_result = reinforcement after generation */
  variant: "above_input" | "above_result";
  locale?: string;
};

/**
 * V187 — Behavior-based guidance (not generic tips). Refreshes on memory updates.
 */
export function CreatorGuidanceCard({ toolSlug, variant, locale = "en" }: Props) {
  const zh = locale.startsWith("zh");
  const { user } = useAuth();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setCreatorMemoryUserId(user?.id ?? null);
  }, [user?.id]);

  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    window.addEventListener("te_v187_memory_updated", bump);
    window.addEventListener("te_v191_analysis_updated", bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener("te_v187_memory_updated", bump);
      window.removeEventListener("te_v191_analysis_updated", bump);
      window.removeEventListener("storage", bump);
    };
  }, []);

  const { pack, profile, score } = useMemo(() => {
    const memory = loadCreatorMemory();
    const profile = inferCreatorProfile(memory);
    const score = computeCreatorScore(memory, toolSlug);
    return {
      pack: computeGuidance(toolSlug, memory, profile, score),
      profile,
      score
    };
  }, [toolSlug, tick]);

  if (zh) return null;

  const isResult = variant === "above_result";

  return (
    <div
      className={`rounded-2xl border px-3.5 py-3 ${
        isResult
          ? "border-violet-200 bg-gradient-to-br from-violet-50/95 to-white"
          : "border-emerald-200 bg-gradient-to-br from-emerald-50/90 to-white"
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {isResult ? "Your next move" : "Creator guidance"}
      </p>
      <p className="mt-1 text-[11px] text-slate-700">
        Score {score.score}/100 · {score.bandLabel} · Stage: {score.stage.title} · Workflow {score.workflowCompletionPercent}%
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{pack.headline}</p>
      <p className="mt-1 text-[11px] text-slate-600">
        Journey · Step {pack.journey_step_id}: {pack.journey_title} · You:{" "}
        <span className="font-medium text-slate-800">
          {profile.creator_level} · goal: {profile.primary_goal} · style: {profile.dominant_style}
        </span>
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-700">
        {pack.bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
      {(pack.next_cta || pack.secondary_cta) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {pack.next_cta ? (
            <Link
              href={pack.next_cta.href}
              className="inline-flex items-center rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
            >
              {pack.next_cta.label} →
            </Link>
          ) : null}
          {pack.secondary_cta ? (
            <Link
              href={pack.secondary_cta.href}
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
            >
              {pack.secondary_cta.label}
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}
