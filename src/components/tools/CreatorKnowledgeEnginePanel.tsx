"use client";

import assets from "@/config/creator-knowledge-engine/v186-assets.json";

type Props = {
  toolSlug: string;
  intentId: string;
  scenarioId: string;
  onIntentChange: (id: string) => void;
  onScenarioChange: (id: string) => void;
  /** EN-only copy for MVP */
  locale?: string;
};

/**
 * V186 — Quick intent + scenario chips (upstream of generation, not a chat UI).
 */
export function CreatorKnowledgeEnginePanel({
  toolSlug,
  intentId,
  scenarioId,
  onIntentChange,
  onScenarioChange,
  locale = "en"
}: Props) {
  const intents = assets.intent_chips[toolSlug as keyof typeof assets.intent_chips] ?? [];
  const scenarios = assets.scenario_chips[toolSlug as keyof typeof assets.scenario_chips] ?? [];
  const zh = locale.startsWith("zh");

  return (
    <div className="mb-4 space-y-3 rounded-2xl border border-sky-200/80 bg-gradient-to-b from-sky-50/90 to-white px-3 py-3 shadow-sm">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-900/80">
          {zh ? "创作意图" : "Quick intent"}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {intents.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onIntentChange(c.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                intentId === c.id
                  ? "bg-sky-600 text-white shadow-sm"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-900/80">
          {zh ? "内容场景" : "Scenario"}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {scenarios.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onScenarioChange(c.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                scenarioId === c.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-[11px] leading-snug text-slate-600">
        {zh
          ? "可不填主题直接生成；填写后结果会更贴合你的细分方向。"
          : "Generate without typing — or add a topic below for a tighter match."}
      </p>
    </div>
  );
}
