"use client";

import { useMemo } from "react";
import { loadCreatorMemory } from "@/lib/creator-guidance/creator-memory-store";
import { computeCreatorScore } from "@/lib/creator-guidance/compute-creator-score";
import { inferCreatorProfile } from "@/lib/creator-guidance/infer-creator-profile";
import { inferMonetizationProfile } from "@/lib/creator-guidance/infer-monetization-profile";
import { useCreatorMemoryRevision } from "@/lib/creator-guidance/use-creator-memory-revision";
import monetizationCopyMap from "../../../generated/v190.1-monetization-copy-map.json";

type Props = {
  toolSlug: string;
  variant?: "full" | "compact";
  locale?: string;
};

/**
 * V190 — Revenue-aware direction from real behavior (memory + score), not generic hustle copy.
 */
export function CreatorMonetizationCard({ toolSlug, variant = "full", locale = "en" }: Props) {
  const zhUi = locale.startsWith("zh");

  const tick = useCreatorMemoryRevision();
  const m = useMemo(() => {
    const memory = loadCreatorMemory();
    const profile = inferCreatorProfile(memory);
    const score = computeCreatorScore(memory, toolSlug);
    return inferMonetizationProfile(memory, profile, score, toolSlug);
  }, [toolSlug, tick]);

  const scoreBand = useMemo(() => {
    const memory = loadCreatorMemory();
    // computeCreatorScore is cheap; we only need the stage band for copy.
    const score = computeCreatorScore(memory, toolSlug);
    return score.band;
  }, [toolSlug, tick]);

  const bandCopy = (monetizationCopyMap.band_to_copy_rules as any)[scoreBand] as
    | { current_priority_copy: string; dont_copy: string; result_usage_hint: string }
    | undefined;
  const modeHint = (monetizationCopyMap.monetization_mode_to_hint as any)[m.best_fit_monetization_mode] as
    | string
    | undefined;

  const focusLabel =
    m.current_focus === "growth" ? "Traffic first" : m.current_focus === "revenue" ? "Conversion focus" : "Balanced";

  if (zhUi) return null;

  if (variant === "compact") {
    return (
      <div className="mb-3 rounded-xl border border-emerald-200/90 bg-emerald-50/60 px-3 py-2 text-[11px] text-emerald-950">
        <span className="font-semibold">{m.best_fit_monetization_mode_label}</span>
        <span className="mx-1.5 text-emerald-700">·</span>
        <span>{focusLabel}</span>
        <span className="mx-1.5 text-emerald-700">·</span>
        <span className="text-emerald-900/90">
          {bandCopy?.current_priority_copy ?? "Traffic before selling"}
        </span>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-2xl border border-emerald-300/90 bg-gradient-to-br from-emerald-50 to-white px-4 py-3 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-900/90">Monetization direction</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">Mode: {m.best_fit_monetization_mode_label}</p>
      <p className="mt-0.5 text-[11px] text-slate-600">Readiness: {m.monetization_readiness} · Goal signal: {m.likely_primary_goal}</p>
      <p className="mt-2 text-xs text-slate-800">{m.headlines.best_goal_line}</p>
      <p className="mt-1 text-xs text-slate-800">{m.headlines.growth_vs_revenue_line}</p>
      <p className="mt-1 text-xs font-medium text-emerald-950">{m.headlines.next_content_type_line}</p>

      {bandCopy?.current_priority_copy ? (
        <p className="mt-2 text-xs text-emerald-950">
          <span className="font-semibold">Current priority:</span> {bandCopy.current_priority_copy}
        </p>
      ) : null}

      {bandCopy?.dont_copy ? (
        <p className="mt-1 text-[11px] text-emerald-900/90">
          <span className="font-semibold">Don&apos;t:</span> {bandCopy.dont_copy}
        </p>
      ) : null}

      {modeHint ? (
        <p className="mt-1 text-[11px] text-emerald-900/90">{modeHint}</p>
      ) : null}

      <p className="mt-2 text-[11px] text-slate-700">
        <span className="font-semibold text-slate-900">Suggested action:</span> {m.headlines.recommended_action}
      </p>
    </div>
  );
}
