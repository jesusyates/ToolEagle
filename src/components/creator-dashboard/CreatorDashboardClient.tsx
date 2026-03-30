"use client";

import { useEffect, useMemo, useState } from "react";
import { loadCreatorMemory } from "@/lib/creator-guidance/creator-memory-store";
import { computeCreatorScore } from "@/lib/creator-guidance/compute-creator-score";
import { loadCreatorAnalysis } from "@/lib/creator-analysis/storage";
import { buildCreatorToolHref, resolveDashboard } from "@/lib/creator-dashboard/resolve-dashboard";
import { CreatorStatusPanel } from "@/components/creator-dashboard/CreatorStatusPanel";
import { CreatorIssuesPanel } from "@/components/creator-dashboard/CreatorIssuesPanel";
import { CreatorNextActionCard } from "@/components/creator-dashboard/CreatorNextActionCard";
import { CreatorWorkflowProgress } from "@/components/creator-dashboard/CreatorWorkflowProgress";
import monetizationCopyMap from "../../../generated/v190.1-monetization-copy-map.json";

const SCORE_TOOL_SLUG = "tiktok-caption-generator";

export function CreatorDashboardClient() {
  const [tick, setTick] = useState(0);

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

  const bundle = useMemo(() => {
    const memory = loadCreatorMemory();
    const score = computeCreatorScore(memory, SCORE_TOOL_SLUG);
    const analysis = loadCreatorAnalysis();
    const dash = resolveDashboard({ score, analysis });
    const href = buildCreatorToolHref({
      action: dash.next_action,
      memory,
      analysis
    });
    return { score, dash, href };
  }, [tick]);

  const { score, dash, href } = bundle;

  const problemTitle = dash.primary_issue?.title ?? "Keep going on your workflow";
  const problemDetail = dash.primary_issue?.detail;
  const priorityHint =
    (monetizationCopyMap.band_to_copy_rules as any)[score.band]?.current_priority_copy as string | undefined;

  return (
    <section className="container max-w-lg py-8 pb-16">
      <h1 className="text-xl font-bold text-slate-50">Creator</h1>
      <p className="mt-1 text-sm text-slate-500">See the problem → fix it in one tap</p>

      <div className="mt-6 space-y-4">
        <CreatorStatusPanel score={dash.score} bandLabel={score.bandLabel} stageTitle={dash.stage} />

        {priorityHint ? <p className="text-xs text-slate-600">Current priority: {priorityHint}</p> : null}
        <CreatorIssuesPanel issues={dash.issues} />

        <CreatorNextActionCard
          href={href}
          ctaLabel={dash.next_action_label}
          problemTitle={problemTitle}
          problemDetail={problemDetail}
        />

        <CreatorWorkflowProgress
          percent={dash.workflow_progress.percent}
          hook={dash.workflow_progress.hook}
          caption={dash.workflow_progress.caption}
          hashtag={dash.workflow_progress.hashtag}
          title={dash.workflow_progress.title}
          publish={dash.workflow_progress.publish}
        />
      </div>
    </section>
  );
}
