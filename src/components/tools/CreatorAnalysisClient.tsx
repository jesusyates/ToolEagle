"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { DelegatedButton } from "@/components/DelegatedButton";
import type {
  AccountGoal,
  AnalysisPlatform,
  CreatorAnalysisInput,
  CreatorAnalysisOutput,
  PastContentItem
} from "@/lib/creator-analysis/types";
import { runCreatorAnalysis, validateAnalysisInput } from "@/lib/creator-analysis/analyze";
import { loadCreatorAnalysis, saveCreatorAnalysis } from "@/lib/creator-analysis/storage";
import { applyCreatorAnalysisToMemory } from "@/lib/creator-analysis/to-downstream";
import { tools } from "@/config/tools";
import { CreatorAnalysisCard } from "@/components/creator-analysis/CreatorAnalysisCard";

const emptyRow = (): PastContentItem => ({ title: "", caption: "", description: "", cta: "" });

function growthVsConversionLine(score: number): string {
  if (score < 48) {
    return "Lean toward reach and discovery — prioritize hooks, trends, and shareable formats.";
  }
  if (score > 62) {
    return "Lean toward conversion and monetization — prioritize proof, offers, and clear CTAs.";
  }
  return "Balanced — alternate reach posts with occasional conversion-focused pieces.";
}

function mixLine(m: CreatorAnalysisOutput["content_mix"]): string {
  return `Tutorial ${m.tutorial}% · Story ${m.storytelling}% · Sell ${m.selling}% · List ${m.listicle}% · Opinion ${m.opinion}% · Other ${m.other}%`;
}

type Props = { relatedAside?: ReactNode };

export function CreatorAnalysisClient({ relatedAside }: Props) {
  const toolMeta = tools.find((t) => t.slug === "creator-analysis");
  const [platform, setPlatform] = useState<AnalysisPlatform>("tiktok");
  const [accountGoal, setAccountGoal] = useState<AccountGoal>("mixed");
  const [niche, setNiche] = useState("");
  const [bio, setBio] = useState("");
  const [positioning, setPositioning] = useState("");
  const [rows, setRows] = useState<PastContentItem[]>(() => Array.from({ length: 5 }, emptyRow));
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<CreatorAnalysisOutput | null>(null);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    const s = loadCreatorAnalysis();
    if (!s) return;
    setPlatform(s.input.platform);
    setAccountGoal(s.input.accountGoal);
    setNiche(s.input.niche);
    setBio(s.input.bio ?? "");
    setPositioning(s.input.positioning ?? "");
    const pc = s.input.pastContent;
    if (pc.length >= 5) {
      setRows(pc.map((r) => ({ ...emptyRow(), ...r })));
    }
    setOutput(s.output);
  }, []);

  const buildInput = useCallback((): CreatorAnalysisInput => {
    return {
      platform,
      accountGoal,
      niche: niche.trim(),
      bio: bio.trim() || undefined,
      positioning: positioning.trim() || undefined,
      pastContent: rows
    };
  }, [platform, accountGoal, niche, bio, positioning, rows]);

  function handleAnalyze() {
    setError(null);
    const input = buildInput();
    const v = validateAnalysisInput(input);
    if (v) {
      setError(v);
      return;
    }
    try {
      const o = runCreatorAnalysis(input);
      setOutput(o);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed.");
    }
  }

  function handleSave() {
    if (!output) return;
    const input = buildInput();
    const v = validateAnalysisInput(input);
    if (v) {
      setError(v);
      return;
    }
    saveCreatorAnalysis(input, output);
    applyCreatorAnalysisToMemory(output, [niche, bio, positioning].join("\n"));
    setSavedToast(true);
    window.setTimeout(() => setSavedToast(false), 2500);
  }

  function updateRow(i: number, patch: Partial<PastContentItem>) {
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }

  function addRow() {
    if (rows.length >= 10) return;
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(i: number) {
    if (rows.length <= 5) return;
    setRows((prev) => prev.filter((_, j) => j !== i));
  }

  const inputSection = (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-slate-800">Platform</span>
          <select
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
            value={platform}
            onChange={(e) => setPlatform(e.target.value as AnalysisPlatform)}
          >
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
            <option value="instagram">Instagram</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-800">Account goal</span>
          <select
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
            value={accountGoal}
            onChange={(e) => setAccountGoal(e.target.value as AccountGoal)}
          >
            <option value="views">Views / reach</option>
            <option value="followers">Followers</option>
            <option value="sales">Sales / leads</option>
            <option value="mixed">Mixed</option>
          </select>
        </label>
      </div>
      <label className="block text-sm">
        <span className="font-medium text-slate-800">Niche</span>
        <input
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          placeholder="e.g. fitness for busy parents"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-slate-800">Bio / positioning (optional)</span>
        <textarea
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
          rows={2}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Short bio line"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-slate-800">How you describe yourself (optional)</span>
        <input
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
          value={positioning}
          onChange={(e) => setPositioning(e.target.value)}
          placeholder="One-line positioning"
        />
      </label>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900">Past posts (5–10)</p>
          <button
            type="button"
            className="text-xs font-medium text-amber-700 underline underline-offset-2"
            onClick={addRow}
            disabled={rows.length >= 10}
          >
            Add row
          </button>
        </div>
        {rows.map((row, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-600">Post {i + 1}</span>
              {rows.length > 5 && (
                <button
                  type="button"
                  className="text-xs text-slate-500 hover:text-red-600"
                  onClick={() => removeRow(i)}
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid gap-2">
              <input
                className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900"
                placeholder="Title"
                value={row.title ?? ""}
                onChange={(e) => updateRow(i, { title: e.target.value })}
              />
              <textarea
                className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900"
                placeholder="Caption or main text"
                rows={2}
                value={row.caption ?? ""}
                onChange={(e) => updateRow(i, { caption: e.target.value })}
              />
              <textarea
                className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900"
                placeholder="Short description (optional)"
                rows={2}
                value={row.description ?? ""}
                onChange={(e) => updateRow(i, { description: e.target.value })}
              />
              <input
                className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900"
                placeholder="CTA (optional)"
                value={row.cta ?? ""}
                onChange={(e) => updateRow(i, { cta: e.target.value })}
              />
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <DelegatedButton
        type="button"
        className="w-full rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow hover:bg-amber-400 sm:w-auto"
        onClick={handleAnalyze}
      >
        Run analysis
      </DelegatedButton>
    </div>
  );

  const resultSection =
    output == null ? (
      <p className="text-sm text-slate-500">Results appear here after you run the analysis.</p>
    ) : (
      <div className="space-y-4">
        <CreatorAnalysisCard output={output} />

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Traffic vs conversion lean</p>
          <p className="mt-1 text-sm text-slate-800">{growthVsConversionLine(output.account_focus_score)}</p>
          <p className="mt-1 text-xs text-slate-600">
            Focus score {output.account_focus_score}/100 (higher = more conversion signals).
          </p>
        </div>

        <div className="rounded-2xl border border-sky-100 bg-sky-50/50 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-sky-900/80">Strengths</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-800">
            {output.top_strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>

        <details className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
          <summary className="cursor-pointer font-medium text-slate-900">Mix & hooks (detail)</summary>
          <p className="mt-2 text-xs">{mixLine(output.content_mix)}</p>
          <p className="mt-1 text-xs">
            Hooks: question {output.hook_distribution.question}% · curiosity {output.hook_distribution.curiosity}% · list{" "}
            {output.hook_distribution.list}% · story {output.hook_distribution.story}% · none {output.hook_distribution.none}%
          </p>
        </details>

        <div className="flex flex-wrap items-center gap-2">
          <DelegatedButton
            type="button"
            className="rounded-xl border border-amber-400 bg-white px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-50"
            onClick={handleSave}
          >
            Save & apply to ToolEagle
          </DelegatedButton>
          {savedToast && <span className="text-xs font-medium text-emerald-700">Saved — other tools will use this context.</span>}
        </div>

        <p className="text-xs text-slate-500">
          Then go to{" "}
          <Link className="font-medium text-amber-700 underline" href="/tools/ai-caption-generator">
            AI Caption Generator
          </Link>
          ,{" "}
          <Link className="font-medium text-amber-700 underline" href="/tools/hashtag-generator">
            Hashtag
          </Link>
          , or{" "}
          <Link className="font-medium text-amber-700 underline" href="/tools/title-generator">
            Title
          </Link>{" "}
          — Knowledge Engine picks up your saved analysis.
        </p>
      </div>
    );

  return (
    <ToolPageShell
      eyebrow="Strategy"
      title={toolMeta?.name ?? "Creator Account Analysis"}
      description={
        toolMeta?.description ??
        "Paste your past posts (no login). Get a structured read of your mix, gaps, and what to post next."
      }
      introProblem="You want to see patterns in what you already post — not just new captions."
      introAudience="Creators who can paste 5–10 posts with at least a title or caption each."
      input={inputSection}
      result={resultSection}
      aside={relatedAside}
      toolSlug="creator-analysis"
      toolName={toolMeta?.name ?? "Creator Account Analysis"}
      locale="en"
    />
  );
}
