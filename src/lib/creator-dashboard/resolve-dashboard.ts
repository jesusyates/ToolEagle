/**
 * V192 — Aggregate V186–V191 into a single dashboard model (client-side inputs).
 */

import type { CreatorMemoryV187 } from "@/lib/creator-guidance/creator-memory-store";
import type { CreatorScoreResult } from "@/lib/creator-guidance/compute-creator-score";
import type { StoredCreatorAnalysis } from "@/lib/creator-analysis/storage";
import type { ContentIssueSnapshot } from "@/lib/creator-analysis/types";

import { buildCreatorAnalysisSummaryForPrompt } from "@/lib/creator-analysis/to-downstream";

export type DashboardNextAction = "generate_hook" | "generate_caption" | "generate_hashtag" | "generate_title";

const ACTION_TO_SLUG: Record<DashboardNextAction, string> = {
  generate_hook: "hook-generator",
  generate_caption: "tiktok-caption-generator",
  generate_hashtag: "hashtag-generator",
  generate_title: "title-generator"
};

export type DashboardResolved = {
  score: number;
  stage: string;
  issues: Array<{ title: string; detail: string }>;
  /** First issue when present; drives next_action + label */
  primary_issue: { title: string; detail: string } | null;
  /** True when next_action was chosen from primary issue (not workflow/score fallback) */
  issue_driven_next: boolean;
  next_action: DashboardNextAction;
  /** CTA copy e.g. "Fix your hook (…)" */
  next_action_label: string;
  workflow_progress: {
    percent: number;
    hook: boolean;
    caption: boolean;
    hashtag: boolean;
    title: boolean;
    publish: boolean;
  };
};

/** Map a single issue to the next tool (used for issues[0] only). */
function mapFirstIssueToAction(i: ContentIssueSnapshot): DashboardNextAction | null {
  const t = `${i.title} ${i.detail}`.toLowerCase();
  const id = i.id.toLowerCase();
  if (id.includes("hook") || /\bhook\b/.test(t) || t.includes("scroll") || t.includes("opener") || t.includes("opening")) {
    return "generate_hook";
  }
  if (id.includes("cta") || t.includes("cta") || t.includes("next step") || t.includes("comment") || t.includes("save")) {
    return "generate_caption";
  }
  if (id.includes("niche") || t.includes("scatter") || t.includes("topic") || t.includes("algorithm")) {
    return "generate_hashtag";
  }
  if (id.includes("title") || t.includes("ctr") || t.includes("thin")) {
    return "generate_title";
  }
  return null;
}

/**
 * V192.2 — Only hook / caption / hashtag / title-shaped issues may drive the CTA.
 * Unknown or vague issues skip to workflow fallback so the button stays executable and stable.
 */
export function isSupportedIssue(i: ContentIssueSnapshot): boolean {
  return mapFirstIssueToAction(i) !== null;
}

function shortenForParen(s: string, max = 48): string {
  const t = s.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trim() + "…";
}

/**
 * "Fix your hook (…)" / "Improve your caption (…)" — parenthetical from primary issue title.
 */
export function buildNextActionLabel(
  action: DashboardNextAction,
  primary: ContentIssueSnapshot | null,
  issueDriven: boolean
): string {
  if (issueDriven && primary) {
    const paren = shortenForParen(primary.title, 52);
    const blob = `${primary.title} ${primary.detail}`;
    switch (action) {
      case "generate_hook":
        return `Fix your hook (${paren})`;
      case "generate_caption":
        if (/cta|next step|comment|save|generic/i.test(blob)) {
          return `Improve your caption (${paren})`;
        }
        return `Fix your caption (${paren})`;
      case "generate_hashtag":
        return `Fix your hashtags (${paren})`;
      case "generate_title":
        return `Fix your titles (${paren})`;
    }
  }
  const generic: Record<DashboardNextAction, string> = {
    generate_hook: "Fix your hook (first line)",
    generate_caption: "Improve your caption (next post)",
    generate_hashtag: "Fix your hashtags (discovery)",
    generate_title: "Fix your titles (CTR)"
  };
  return generic[action];
}

export type ResolveNextResult = {
  action: DashboardNextAction;
  issue_driven: boolean;
};

/**
 * Priority: **issues[0]** only if `isSupportedIssue` → else workflow gaps → score band.
 */
export function resolveNextDashboardAction(
  analysis: StoredCreatorAnalysis | null,
  score: CreatorScoreResult
): ResolveNextResult {
  const list = analysis?.output?.content_issues ?? [];
  if (list.length > 0) {
    const first = list[0];
    if (isSupportedIssue(first)) {
      const mapped = mapFirstIssueToAction(first);
      if (mapped) {
        return { action: mapped, issue_driven: true };
      }
    }
    /* unsupported or unmapped primary issue — do not guess; use workflow / score */
  }

  const cp = score.workflowCheckpoints;
  if (!cp.hook) return { action: "generate_hook", issue_driven: false };
  if (!cp.caption) return { action: "generate_caption", issue_driven: false };
  if (!cp.hashtag) return { action: "generate_hashtag", issue_driven: false };
  if (!cp.title) return { action: "generate_title", issue_driven: false };

  if (score.band === "beginner" || score.band === "rising") return { action: "generate_hook", issue_driven: false };
  if (score.band === "advanced") return { action: "generate_title", issue_driven: false };
  return { action: "generate_caption", issue_driven: false };
}

function issuesFromAnalysis(analysis: StoredCreatorAnalysis | null): DashboardResolved["issues"] {
  if (!analysis?.output?.content_issues?.length) return [];
  return analysis.output.content_issues.slice(0, 5).map((i) => ({ title: i.title, detail: i.detail }));
}

function primaryIssueFromAnalysis(analysis: StoredCreatorAnalysis | null): ContentIssueSnapshot | null {
  const list = analysis?.output?.content_issues;
  if (!list?.length) return null;
  return list[0];
}

export function resolveDashboard(opts: {
  score: CreatorScoreResult;
  analysis: StoredCreatorAnalysis | null;
}): DashboardResolved {
  const { score, analysis } = opts;
  const primary = primaryIssueFromAnalysis(analysis);
  const { action: next_action, issue_driven: issue_driven_next } = resolveNextDashboardAction(analysis, score);
  const next_action_label = buildNextActionLabel(
    next_action,
    issue_driven_next ? primary : null,
    issue_driven_next
  );
  const wf = score.workflowCheckpoints;
  return {
    score: score.score,
    stage: score.stage.title,
    issues: issuesFromAnalysis(analysis),
    primary_issue: primary ? { title: primary.title, detail: primary.detail } : null,
    issue_driven_next,
    next_action,
    next_action_label,
    workflow_progress: {
      percent: score.workflowCompletionPercent,
      hook: wf.hook,
      caption: wf.caption,
      hashtag: wf.hashtag,
      title: wf.title,
      publish: wf.publishRedirect
    }
  };
}

/** Max length for query string (browser / server limits). */
const MAX_SUMMARY_QUERY = 2000;

/**
 * Deep link to `/tools/{slug}` with V186 chips and optional V191 summary in the URL.
 */
export function buildCreatorToolHref(opts: {
  action: DashboardNextAction;
  memory: CreatorMemoryV187;
  analysis: StoredCreatorAnalysis | null;
}): string {
  const slug = ACTION_TO_SLUG[opts.action];
  const intent = opts.memory.last_v186_intent_id?.trim() || "intent_views";
  const scenario = opts.memory.last_v186_scenario_id?.trim() || "sc_tutorial";
  const params = new URLSearchParams();
  params.set("v186_intent", intent);
  params.set("v186_scenario", scenario);

  if (opts.analysis) {
    const summary = buildCreatorAnalysisSummaryForPrompt(
      opts.analysis.output,
      [opts.analysis.input.niche, opts.analysis.input.bio ?? "", opts.analysis.input.positioning ?? ""].join("\n")
    );
    if (summary.length > 0 && summary.length <= MAX_SUMMARY_QUERY) {
      params.set("creatorAnalysisSummary", summary);
    }
  }

  return `/tools/${slug}?${params.toString()}`;
}

export function dashboardActionSlug(action: DashboardNextAction): string {
  return ACTION_TO_SLUG[action];
}
